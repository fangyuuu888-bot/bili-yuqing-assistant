// B站评论采集 - 通过B站公开API获取评论
// B站评论API: https://api.bilibili.com/x/v2/reply/main (旧版) 或 /v2/reply/wbi/main (新版)

(function() {
  'use strict';

  // 从URL中提取视频ID (BV号)
  function getVideoId() {
    const url = window.location.href;
    const match = url.match(/\/video\/(BV\w+)/i) || url.match(/b23\.tv\/(\w+)/i);
    return match ? match[1] : null;
  }

  // 从BV号获取aid (通过API)
  async function getAidFromBV(bvid) {
    try {
      const resp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid, {
        credentials: 'include'
      });
      const json = await resp.json();
      if (json.code === 0 && json.data) {
        return {
          aid: json.data.aid,
          title: json.data.title,
          author: json.data.owner ? json.data.owner.name : '',
          mid: json.data.owner ? json.data.owner.mid : '',
          stat: json.data.stat
        };
      }
    } catch (e) {
      console.error('[舆情助手] 获取视频信息失败:', e);
    }
    return null;
  }

  // 获取评论
  async function fetchComments(aid, pages) {
    const allComments = [];
    const pageSize = 30;

    for (let page = 1; page <= pages; page++) {
      try {
        const url = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + aid +
          '&ps=' + pageSize + '&pn=' + page + '&mode=3&jsonpcallback=&_=' + Date.now();

        const resp = await fetch(url, { credentials: 'include' });
        const json = await resp.json();

        if (json.code !== 0 || !json.data || !json.data.replies) break;

        const replies = json.data.replies;
        if (replies.length === 0) break;

        for (const r of replies) {
          if (!r.content || !r.content.message) continue;

          allComments.push({
            user: r.member ? r.member.uname : '匿名用户',
            avatar: r.member ? r.member.uname.charAt(0) : '?',
            text: r.content.message,
            likes: r.like || 0,
            replies: r.rcount || 0,
            time: formatTime(r.ctime),
            mid: r.mid || 0,
            level: r.member ? r.member.level : 0,
            vip: r.member && r.member.vip ? r.member.vip.status : 0
          });

          // 采集二级评论
          if (r.replies && r.replies.length > 0) {
            for (const sub of r.replies.slice(0, 5)) {
              if (!sub.content || !sub.content.message) continue;
              allComments.push({
                user: sub.member ? sub.member.uname : '匿名用户',
                avatar: sub.member ? sub.member.uname.charAt(0) : '?',
                text: sub.content.message,
                likes: sub.like || 0,
                replies: 0,
                time: formatTime(sub.ctime),
                mid: sub.mid || 0,
                level: sub.member ? sub.member.level : 0,
                vip: sub.member && sub.member.vip ? sub.member.vip.status : 0
              });
            }
          }
        }

        // 如果返回不足一页，说明没有更多了
        if (replies.length < pageSize) break;

        // 短暂延迟，避免请求过快
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error('[舆情助手] 获取第' + page + '页评论失败:', e);
        break;
      }
    }

    return allComments;
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    return (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  }

  // 从DOM提取评论（备用方案）
  function extractFromDOM() {
    var comments = [];
    var selectors = [
      '.reply-item, .root-reply, [class*="reply-item"]',
      '[class*="ReplyItem"], [class*="CommentItem"]',
      '.comment-list .reply-item, #comment .reply-item'
    ];

    var items = [];
    for (var i = 0; i < selectors.length; i++) {
      items = document.querySelectorAll(selectors[i]);
      if (items.length > 0) break;
    }

    var seenTexts = new Set();
    items.forEach(function(el) {
      try {
        var userEl = el.querySelector('.user-name, [class*="user-name"], [class*="name"]');
        var textEl = el.querySelector('.reply-content, [class*="content"], [class*="text"], [class*="message"]');
        var likeEl = el.querySelector('[class*="like"], [class*="digg"], .like-count');

        if (textEl && textEl.textContent.trim()) {
          var text = textEl.textContent.trim();
          if (seenTexts.has(text)) return;
          seenTexts.add(text);
          comments.push({
            user: userEl ? userEl.textContent.trim() : '匿名用户',
            avatar: (userEl ? userEl.textContent.trim() : '?').charAt(0),
            text: text,
            likes: likeEl ? parseInt(likeEl.textContent.trim().replace(/[^0-9]/g, '')) || 0 : 0,
            replies: 0, time: '', mid: 0, level: 0, vip: 0
          });
        }
      } catch (e) {}
    });

    return comments;
  }

  // 监听来自popup的采集指令
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type !== 'CAPTURE_COMMENTS') return;

    (async function() {
      const bvid = getVideoId();
      if (!bvid) {
        sendResponse({ success: false, error: '未检测到B站视频，请在视频播放页使用' });
        return;
      }

      var videoInfo = await getAidFromBV(bvid);
      var title = videoInfo ? videoInfo.title : document.title;
      var author = videoInfo ? videoInfo.author : '';

      var comments = [];
      if (videoInfo && videoInfo.aid) {
        comments = await fetchComments(videoInfo.aid, 50);
      }

      // API获取不足时，从DOM补充
      if (comments.length < 10) {
        var domComments = extractFromDOM();
        var seen = new Set(comments.map(function(c) { return c.text; }));
        for (var i = 0; i < domComments.length; i++) {
          if (!seen.has(domComments[i].text)) {
            seen.add(domComments[i].text);
            comments.push(domComments[i]);
          }
        }
      }

      if (comments.length === 0) {
        sendResponse({ success: false, error: '采集评论失败，请确保评论区已展开' });
        return;
      }

      sendResponse({
        success: true,
        count: comments.length,
        comments: comments,
        videoId: bvid,
        videoTitle: title,
        videoAuthor: author,
        platform: 'bilibili'
      });
    })();

    return true; // 保持消息通道开放
  });

  console.log('[舆情助手] B站评论采集模块已加载');
})();
