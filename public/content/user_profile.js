// B站用户主页画像采集 v4 — DOM优先 + API补充
// 策略：用户信息和视频列表从DOM提取，视频详情和评论用API补充
(function() {
  'use strict';

  function getUid() {
    var m = location.pathname.match(/(\d+)/);
    return m ? m[1] : '';
  }

  function parseCount(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    str = String(str).trim().replace(/,/g, '').replace(/\s+/g, '');
    if (str.indexOf('亿') >= 0) return Math.round(parseFloat(str) * 100000000);
    if (str.indexOf('万') >= 0) return Math.round(parseFloat(str) * 10000);
    return parseInt(str) || 0;
  }

  function formatDate(ts) {
    if (!ts) return '';
    var d = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatMonth(ts) {
    if (!ts) return '';
    var d = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // === API 获取粉丝/关注数（可靠，不受 DOM 变化影响）===
  async function fetchRelationStats(uid) {
    try {
      var resp = await fetch('https://api.bilibili.com/x/relation/stat?vmid=' + uid, {
        credentials: 'include'
      });
      var json = await resp.json();
      if (json.code === 0 && json.data) {
        return {
          followers: json.data.follower || 0,
          following: json.data.following || 0
        };
      }
    } catch (e) {
      console.log('[舆情助手] relation/stat API 失败:', e);
    }
    return null;
  }

  // === DOM 提取用户信息 ===
  function extractUserInfoFromDOM() {
    var info = { nickname: '', uid: getUid(), bio: '', avatar: '', followers: 0, following: 0, totalLikes: 0, totalPlays: 0 };

    // 1. 多种选择器提取粉丝/关注数
    try {
      // 方式A: a[href*="/relation/"] 链接
      var statLinks = document.querySelectorAll('a[href*="/relation/"]');
      statLinks.forEach(function(el) {
        var text = el.textContent || '';
        var num = parseCount(text);
        if (text.indexOf('粉丝') >= 0 && !info.followers) info.followers = num;
        else if (text.indexOf('关注') >= 0 && !info.following) info.following = num;
      });
    } catch (e) {}

    // 方式B: n-data 结构（B站新版布局）
    if (!info.followers || !info.following) {
      try {
        var dataBlocks = document.querySelectorAll('.n-data, [class*=n-data]');
        dataBlocks.forEach(function(block) {
          var valEl = block.querySelector('.n-data-v, [class*=n-data-v]');
          var labelEl = block.querySelector('.n-data-t, [class*=n-data-t]');
          if (!valEl || !labelEl) return;
          var val = parseCount(valEl.textContent.trim());
          var label = labelEl.textContent.trim();
          if (label.indexOf('粉丝') >= 0 && !info.followers) info.followers = val;
          else if (label.indexOf('关注') >= 0 && !info.following) info.following = val;
        });
      } catch (e) {}
    }

    // 方式C: 从页面文本正则匹配
    if (!info.followers || !info.following) {
      try {
        var allText = document.body.innerText || '';
        if (!info.followers) {
          var fanMatch = allText.match(/粉丝[数]?\s*[:：]?\s*([\d.]+万?亿?)/);
          if (fanMatch) info.followers = parseCount(fanMatch[1]);
        }
        if (!info.following) {
          var followMatch = allText.match(/(?<!互)关注[数]?\s*[:：]?\s*([\d.]+万?亿?)/);
          if (followMatch) info.following = parseCount(followMatch[1]);
        }
      } catch (e) {}
    }

    // 2. 获赞数和播放数
    try {
      var allText2 = document.body.innerText || '';
      var likeMatch = allText2.match(/获赞数[\s\n]*([\d.]+万?)/);
      var playMatch = allText2.match(/播放数[\s\n]*([\d.]+万?)/);
      if (likeMatch) info.totalLikes = parseCount(likeMatch[1]);
      if (playMatch) info.totalPlays = parseCount(playMatch[1]);
    } catch (e) {}

    // 3. 昵称
    try {
      var nameSelectors = ['.h-basic .name', '#h-name', '.username', '[class*=user-name]', '[class*=nickname]', 'h1', '.h-basic h1'];
      for (var i = 0; i < nameSelectors.length; i++) {
        var el = document.querySelector(nameSelectors[i]);
        if (el && el.textContent.trim().length > 0 && el.textContent.trim().length < 30) {
          info.nickname = el.textContent.trim();
          break;
        }
      }
    } catch (e) {}

    if (!info.nickname) {
      try { info.nickname = document.title.replace(/[-_| 的个空间主页].*$/, '').trim(); } catch (e) {}
    }

    // 4. 简介/签名
    try {
      var bioSelectors = ['.h-sign', '.sign', '[class*=bio]', '[class*=signature]', '.user-sign'];
      for (var j = 0; j < bioSelectors.length; j++) {
        var bioEl = document.querySelector(bioSelectors[j]);
        if (bioEl && bioEl.textContent.trim().length > 0) {
          info.bio = bioEl.textContent.trim();
          break;
        }
      }
    } catch (e) {}

    return info;
  }

  // === DOM 提取视频列表 ===
  function extractVideosFromDOM() {
    var videos = [];
    var seen = {};

    // 收集所有视频链接
    var links = document.querySelectorAll('a[href*="/video/"], a[href*="b23.tv"]');

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.href || '';
      var text = (link.textContent || '').trim();

      // 提取 BV 号
      var bvMatch = href.match(/BV[\w]+/);
      if (!bvMatch) continue;
      var bvid = bvMatch[0];

      // 去重
      if (seen[bvid]) continue;
      seen[bvid] = 1;

      // 提取标题（过滤纯数字/时长的链接）
      var title = '';
      if (text.length > 3 && text.length < 100 && !/^[\d.万:]+$/.test(text.replace(/\s/g, ''))) {
        title = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      }

      // 如果这个链接没有标题，找父元素中的标题
      if (!title) {
        var parent = link.closest('[class*=item], [class*=card], li, .small-item');
        if (parent) {
          var titleEl = parent.querySelector('[class*=title], [title], a.title');
          if (titleEl) {
            title = titleEl.getAttribute('title') || titleEl.textContent.trim();
          }
        }
      }

      if (title && title.length > 2) {
        videos.push({
          title: title,
          bvid: bvid,
          aid: 0,
          plays: 0,
          likes: 0,
          comments: 0,
          date: '',
          month: '',
          timestamp: 0,
          cover: '',
          description: ''
        });
      }
    }

    return videos;
  }

  async function scrollAndCollectVideos() {
    var allVideos = [];
    var seen = {};
    var prevCount = 0;
    var stableCount = 0;

    // 1. 从当前页面内联脚本提取 BV 号
    var pageBvids = extractBVIdsFromPage();
    pageBvids.forEach(function(bv) {
      if (!seen[bv]) {
        seen[bv] = 1;
        allVideos.push({
          title: '', bvid: bv, aid: 0, plays: 0, likes: 0, comments: 0,
          date: '', month: '', timestamp: 0, cover: '', description: ''
        });
      }
    });
    console.log('[舆情助手] 内联脚本提取 BV:', pageBvids.length);

    // 2. 从全页面 HTML 提取 BV 号
    if (allVideos.length === 0) {
      var htmlBvids = extractBVIdsFromHTML();
      htmlBvids.forEach(function(bv) {
        if (!seen[bv]) {
          seen[bv] = 1;
          allVideos.push({
            title: '', bvid: bv, aid: 0, plays: 0, likes: 0, comments: 0,
            date: '', month: '', timestamp: 0, cover: '', description: ''
          });
        }
      });
      console.log('[舆情助手] HTML 提取 BV:', htmlBvids.length);
    }

    // 3. 安全地从投稿页提取视频（不触发页面跳转）
    if (location.pathname.indexOf('/video') < 0 && location.pathname.indexOf('/upload') < 0) {
      var uid = getUid();
      if (uid) {
        try {
          var resp = await fetch('https://space.bilibili.com/' + uid + '/video', { credentials: 'include' });
          var html = await resp.text();
          var bvRegex = /BV[a-zA-Z0-9]{10}/g;
          var bvMatches = html.match(bvRegex) || [];
          var uniqueBvs = [];
          var bvSeen = {};
          bvMatches.forEach(function(bv) {
            if (!bvSeen[bv]) { bvSeen[bv] = 1; uniqueBvs.push(bv); }
          });
          uniqueBvs.forEach(function(bv) {
            if (!seen[bv]) {
              seen[bv] = 1;
              allVideos.push({
                title: '', bvid: bv, aid: 0, plays: 0, likes: 0, comments: 0,
                date: '', month: '', timestamp: 0, cover: '', description: ''
              });
            }
          });
          console.log('[舆情助手] 投稿页 fetch 提取 BV:', uniqueBvs.length);
        } catch (e) {
          console.log('[舆情助手] 投稿页 fetch 失败:', e);
        }
      }
    }

    // 4. 滚动当前页面补充收集（不导航）
    for (var i = 0; i < 12; i++) {
      var batch = extractVideosFromDOM();
      batch.forEach(function(v) {
        if (!seen[v.bvid]) {
          seen[v.bvid] = 1;
          allVideos.push(v);
        }
      });

      if (allVideos.length === prevCount) {
        stableCount++;
        if (stableCount >= 3) break;
      } else {
        stableCount = 0;
        prevCount = allVideos.length;
      }

      window.scrollBy(0, 600);
      await new Promise(function(r) { setTimeout(r, 800); });
    }

    return allVideos;
  }

  // === API 补充视频详情 ===
  async function enrichVideoDetails(videos, maxCount) {
    maxCount = maxCount || 15;
    var topVideos = videos.slice(0, maxCount);

    for (var i = 0; i < topVideos.length; i++) {
      if (!topVideos[i].bvid) continue;

      try {
        var resp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + topVideos[i].bvid, {
          credentials: 'include'
        });
        var json = await resp.json();

        if (json.code === 0 && json.data) {
          var stat = json.data.stat || {};
          topVideos[i].aid = stat.aid || topVideos[i].aid;
          topVideos[i].plays = stat.view || topVideos[i].plays;
          topVideos[i].likes = stat.like || 0;
          topVideos[i].comments = stat.reply || topVideos[i].comments;
          topVideos[i].description = json.data.desc || topVideos[i].description;
          topVideos[i].title = json.data.title || topVideos[i].title;
          topVideos[i].cover = json.data.pic || '';
          topVideos[i].length = json.data.duration || 0;

          if (json.data.pubdate) {
            topVideos[i].timestamp = json.data.pubdate;
            topVideos[i].date = formatDate(json.data.pubdate);
            topVideos[i].month = formatMonth(json.data.pubdate);
          }
        }
      } catch (e) {
        console.log('[舆情助手] 视频详情失败:', topVideos[i].bvid, e);
      }

      await new Promise(function(r) { setTimeout(r, 200); });
    }

    // 更新原数组
    for (var j = 0; j < topVideos.length; j++) {
      var idx = videos.findIndex(function(v) { return v.bvid === topVideos[j].bvid; });
      if (idx >= 0) videos[idx] = topVideos[j];
    }

    return videos;
  }

  // === 采集评论 ===
  async function fetchVideoComments(aid, maxPages) {
    var comments = [];
    maxPages = maxPages || 2;

    for (var page = 1; page <= maxPages; page++) {
      try {
        var url = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + aid +
          '&ps=30&pn=' + page + '&mode=3&_=' + Date.now();
        var resp = await fetch(url, { credentials: 'include' });
        var json = await resp.json();
        if (json.code !== 0 || !json.data || !json.data.replies) break;

        var replies = json.data.replies;
        if (replies.length === 0) break;

        for (var i = 0; i < replies.length; i++) {
          var r = replies[i];
          if (!r.content || !r.content.message) continue;
          var member = r.member || {};
          comments.push({
            user: member.uname || '匿名用户',
            mid: member.mid || r.mid || 0,
            avatar: member.avatar || '',
            text: r.content.message,
            likes: r.like || 0,
            replies: r.count || 0,
            time: formatDate(r.ctime),
            timestamp: r.ctime || 0,
            level: member.level_info ? member.level_info.current_level || 0 : 0,
            vip: member.vip ? member.vip.vipType || 0 : 0
          });
        }
      } catch (e) { break; }
      await new Promise(function(r) { setTimeout(r, 200); });
    }

    return comments;
  }

  async function collectCommenterStats(videos) {
    // 取播放量或评论数最高的前5个视频（plays为0时用comments排序）
    var sorted = videos.slice().sort(function(a, b) {
      return (b.plays || b.comments || 0) - (a.plays || a.comments || 0);
    });
    var topVideos = sorted.slice(0, 5);

    // 对没有 aid 的视频，通过 web-interface/view API 补充
    for (var k = 0; k < topVideos.length; k++) {
      if (!topVideos[k].aid && topVideos[k].bvid) {
        try {
          var vresp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + topVideos[k].bvid, {
            credentials: 'include'
          });
          var vjson = await vresp.json();
          if (vjson.code === 0 && vjson.data) {
            topVideos[k].aid = (vjson.data.stat && vjson.data.stat.aid) || vjson.data.aid || 0;
            if (!topVideos[k].title) topVideos[k].title = vjson.data.title || '';
            if (!topVideos[k].plays) topVideos[k].plays = (vjson.data.stat && vjson.data.stat.view) || 0;
          }
        } catch (e) {}
        await new Promise(function(r) { setTimeout(r, 200); });
      }
    }

    // 过滤掉仍然没有 aid 的视频
    topVideos = topVideos.filter(function(v) { return v.aid; });

    var allComments = [];
    var userStats = {};

    for (var i = 0; i < topVideos.length; i++) {
      var comments = await fetchVideoComments(topVideos[i].aid, 2);

      comments.forEach(function(c) {
        allComments.push(c);
        var key = c.mid || c.user;
        if (!userStats[key]) {
          userStats[key] = {
            user: c.user,
            avatar: c.avatar,
            mid: c.mid,
            commentCount: 0,
            totalLikes: 0,
            totalReplies: 0,
            comments: []
          };
        }
        userStats[key].commentCount++;
        userStats[key].totalLikes += (c.likes || 0);
        userStats[key].totalReplies += (c.replies || 0);
        if (userStats[key].comments.length < 3) {
          userStats[key].comments.push({ text: c.text, likes: c.likes, videoTitle: topVideos[i].title });
        }
      });

      await new Promise(function(r) { setTimeout(r, 300); });
    }

    return { allComments: allComments, userStats: userStats };
  }

  // === 尝试 API 获取视频列表（多端点 + 分页轮询）===
  async function tryApiVideoList(uid) {
    var videos = [];
    var seen = {};

    function addVideo(v) {
      if (!v.bvid || seen[v.bvid]) return;
      seen[v.bvid] = 1;
      videos.push(v);
    }

    // 端点1: wbi/arc/search（新版端点，分页获取最多3页=90条）
    for (var pn = 1; pn <= 3; pn++) {
      try {
        var resp = await fetch('https://api.bilibili.com/x/space/wbi/arc/search?mid=' + uid +
          '&ps=30&pn=' + pn + '&order=pubdate&_=' + Date.now(), { credentials: 'include' });
        var json = await resp.json();
        if (json.code === 0 && json.data && json.data.list && json.data.list.vlist && json.data.list.vlist.length > 0) {
          json.data.list.vlist.forEach(function(v) {
            addVideo({
              title: v.title || '',
              bvid: v.bvid || '',
              aid: v.aid || 0,
              plays: v.play || 0,
              likes: 0,
              comments: v.video_review || 0,
              date: formatDate(v.created),
              month: formatMonth(v.created),
              timestamp: v.created || 0,
              cover: v.pic || '',
              length: v.length || '',
              description: v.description || ''
            });
          });
          if (json.data.list.vlist.length < 30) break;
          await new Promise(function(r) { setTimeout(r, 300); });
        } else {
          if (pn === 1) console.log('[舆情助手] wbi/arc/search 返回:', json.code, json.message);
          break;
        }
      } catch (e) {
        if (pn === 1) console.log('[舆情助手] wbi/arc/search 异常:', e);
        break;
      }
    }
    if (videos.length > 0) {
      console.log('[舆情助手] wbi/arc/search 共获取:', videos.length);
      return videos;
    }

    // 端点2: 旧版 arc/search（分页获取最多3页）
    for (var pn2 = 1; pn2 <= 3; pn2++) {
      try {
        var resp2 = await fetch('https://api.bilibili.com/x/space/arc/search?mid=' + uid +
          '&ps=30&pn=' + pn2 + '&order=pubdate&jsonp=jsonp&_=' + Date.now(), { credentials: 'include' });
        var json2 = await resp2.json();
        if (json2.code === 0 && json2.data && json2.data.list && json2.data.list.vlist && json2.data.list.vlist.length > 0) {
          json2.data.list.vlist.forEach(function(v) {
            addVideo({
              title: v.title || '',
              bvid: v.bvid || '',
              aid: v.aid || 0,
              plays: v.play || 0,
              likes: 0,
              comments: v.video_review || 0,
              date: formatDate(v.created),
              month: formatMonth(v.created),
              timestamp: v.created || 0,
              cover: v.pic || '',
              length: v.length || '',
              description: v.description || ''
            });
          });
          if (json2.data.list.vlist.length < 30) break;
          await new Promise(function(r) { setTimeout(r, 300); });
        } else {
          if (pn2 === 1) console.log('[舆情助手] arc/search 返回:', json2.code, json2.message);
          break;
        }
      } catch (e) {
        if (pn2 === 1) console.log('[舆情助手] arc/search 异常:', e);
        break;
      }
    }
    if (videos.length > 0) {
      console.log('[舆情助手] arc/search 共获取:', videos.length);
      return videos;
    }

    // 端点3: polymer/web-dynamic/v1/feed/space（动态流，分页获取最多5页）
    var offset = '';
    for (var page = 0; page < 5; page++) {
      try {
        var resp3 = await fetch('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + uid +
          '&offset=' + offset + '&page=' + (page + 1) + '&_=' + Date.now(), { credentials: 'include' });
        var json3 = await resp3.json();
        if (json3.code === 0 && json3.data && json3.data.items) {
          json3.data.items.forEach(function(item) {
            var modules = item.modules || {};
            var major = (modules.module_dynamic || {}).major || {};
            if (major.type === 'MAJOR_TYPE_ARCHIVE' && major.archive) {
              var arc = major.archive;
              addVideo({
                title: arc.title || '',
                bvid: arc.bvid || '',
                aid: arc.aid || 0,
                plays: 0, likes: 0, comments: 0,
                date: '', month: '', timestamp: 0,
                cover: arc.cover || '',
                length: arc.duration_text || '',
                description: arc.desc || ''
              });
            }
          });
          if (json3.data.offset) offset = json3.data.offset;
          if (!json3.data.has_more) break;
          await new Promise(function(r) { setTimeout(r, 300); });
        } else {
          if (page === 0) console.log('[舆情助手] dynamic feed 返回:', json3.code, json3.message);
          break;
        }
      } catch (e) {
        if (page === 0) console.log('[舆情助手] dynamic feed 异常:', e);
        break;
      }
    }
    if (videos.length > 0) console.log('[舆情助手] dynamic feed 共获取:', videos.length);

    return videos;
  }

  // === 从页面内联脚本提取 BV 号 ===
  function extractBVIdsFromPage() {
    var bvids = [];
    var seen = {};

    try {
      var scripts = document.querySelectorAll('script');
      for (var i = 0; i < scripts.length; i++) {
        var content = scripts[i].textContent || '';
        var matches = content.match(/BV[a-zA-Z0-9]{10}/g);
        if (matches) {
          matches.forEach(function(bv) {
            if (!seen[bv]) { seen[bv] = 1; bvids.push(bv); }
          });
        }
      }
    } catch (e) {}

    return bvids;
  }

  // === 从当前页面 HTML 提取 BV 号（全量搜索）===
  function extractBVIdsFromHTML() {
    var bvids = [];
    var seen = {};
    try {
      var html = document.documentElement.outerHTML;
      var matches = html.match(/BV[a-zA-Z0-9]{10}/g) || [];
      matches.forEach(function(bv) {
        if (!seen[bv]) { seen[bv] = 1; bvids.push(bv); }
      });
    } catch (e) {}
    return bvids;
  }

  // === 主采集流程 ===
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type !== 'COLLECT_PROFILE') return;

    (async function() {
      try {
        var uid = getUid();
        if (!uid) {
          sendResponse({ success: false, error: '未检测到B站用户ID，请确保在B站用户主页使用' });
          return;
        }

        var showProgress = function(msg) {
          try { chrome.runtime.sendMessage({ type: 'COLLECT_PROGRESS', message: msg }); } catch (e) {}
        };

        // 1. 从 DOM 提取用户信息
        showProgress('正在获取用户信息...');
        var userInfo = extractUserInfoFromDOM();

        // 1b. API 获取粉丝/关注数（比 DOM 更可靠）
        showProgress('正在获取粉丝数据...');
        var relationStats = await fetchRelationStats(uid);
        if (relationStats) {
          if (relationStats.followers > 0) userInfo.followers = relationStats.followers;
          if (relationStats.following > 0) userInfo.following = relationStats.following;
        }

        // 2. 尝试 API 获取视频列表（登录用户可用）
        showProgress('正在获取视频列表...');
        var videos = await tryApiVideoList(uid);

        // 3. API 失败则从 DOM 提取
        if (videos.length === 0) {
          showProgress('正在从页面提取视频...');
          videos = await scrollAndCollectVideos();
        }

        // 4. 补充视频详情
        if (videos.length > 0) {
          showProgress('正在获取视频详情 (' + Math.min(videos.length, 30) + ' 个)...');
          videos = await enrichVideoDetails(videos, 30);
        }

        // 5. 采集评论数据
        var allComments = [];
        var userStats = {};
        if (videos.length > 0) {
          showProgress('正在采集评论数据...');
          var commenterData = await collectCommenterStats(videos);
          allComments = commenterData.allComments;
          userStats = commenterData.userStats;
        }

        // 6. 构建排行
        var userArr = Object.values(userStats);
        var likeRanking = userArr
          .filter(function(u) { return u.totalLikes > 0; })
          .sort(function(a, b) { return b.totalLikes - a.totalLikes; })
          .slice(0, 10)
          .map(function(u, i) {
            return {
              rank: i + 1,
              user: u.user,
              likes: u.totalLikes,
              commentSample: u.comments[0] || { text: '' }
            };
          });

        var commentRanking = userArr
          .filter(function(u) { return u.commentCount > 0; })
          .sort(function(a, b) { return b.commentCount - a.commentCount; })
          .slice(0, 10)
          .map(function(u, i) {
            return {
              rank: i + 1,
              user: u.user,
              comments: u.commentCount,
              replies: u.totalReplies,
              commentSample: u.comments[0] || { text: '' }
            };
          });

        // 7. 计算统计
        var totalVideoLikes = videos.reduce(function(s, v) { return s + (v.likes || 0); }, 0);
        var totalVideoPlays = videos.reduce(function(s, v) { return s + (v.plays || 0); }, 0);

        var accountLikes = userInfo.totalLikes || totalVideoLikes;
        var totalPlays = userInfo.totalPlays || totalVideoPlays;

        sendResponse({
          success: true,
          profile: {
            nickname: userInfo.nickname || '未知用户',
            uid: uid,
            bio: userInfo.bio,
            avatar: userInfo.avatar,
            platform: 'bilibili',
            followers: userInfo.followers,
            following: userInfo.following,
            accountLikes: accountLikes,
            totalPlays: totalPlays,
            videoCount: videos.length,
            videos: videos,
            totalVideoLikes: totalVideoLikes,
            avgVideoLikes: videos.length > 0 ? Math.round(totalVideoLikes / videos.length) : 0,
            totalVideoPlays: totalVideoPlays,
            avgVideoPlays: videos.length > 0 ? Math.round(totalVideoPlays / videos.length) : 0,
            allComments: allComments,
            likeRanking: likeRanking,
            commentRanking: commentRanking,
            url: location.href,
            timestamp: Date.now()
          }
        });
      } catch (e) {
        console.error('[舆情助手] 采集错误:', e);
        sendResponse({ success: false, error: '内部错误: ' + e.message });
      }
    })();
    return true;
  });

  console.log('[B站舆情助手] 用户画像采集模块已加载 v4');
})();
