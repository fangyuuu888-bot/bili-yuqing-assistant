// Background Service Worker
// 处理扩展图标点击、消息中转、数据存储

// 清理评论文本：移除图片URL/文件名/HTML标签
function cleanCommentText(text) {
  if (!text) return '';
  // 移除完整URL
  text = text.replace(/https?:\/\/[^\s]+/gi, '');
  // 移除路径/文件名+图片扩展名（含斜杠路径如 hash/hash.jpg）
  text = text.replace(/[a-zA-Z0-9\/_\-]{6,}\.(jpg|jpeg|png|gif|webp|bmp)/gi, '');
  // 移除HTML img标签
  text = text.replace(/<img[^>]*>/gi, '');
  // 移除BBCode图片标签
  text = text.replace(/\[img[^\]]*\][^\[]*\[\/img\]/gi, '');
  // 清理多余空格和换行
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// 监听扩展图标点击 - 打开仪表盘
chrome.action.onClicked.addListener(function() {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// 采集进度（跨消息持久化）
var collectProgress = '';

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'SAVE_COMMENTS') {
    // 存储评论数据
    chrome.storage.local.set({
      ['comments_' + request.videoId]: {
        data: request.data,
        platform: request.platform,
        videoId: request.videoId,
        videoTitle: request.videoTitle,
        videoAuthor: request.videoAuthor,
        timestamp: Date.now()
      }
    }, function() {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'GET_COMMENTS') {
    chrome.storage.local.get('comments_' + request.videoId, function(result) {
      sendResponse(result['comments_' + request.videoId] || null);
    });
    return true;
  }

  if (request.type === 'GET_LATEST_COMMENTS') {
    chrome.storage.local.get(null, function(all) {
      let latest = null;
      let latestKey = null;
      Object.keys(all).forEach(function(key) {
        if (key.startsWith('comments_')) {
          if (!latest || all[key].timestamp > latest.timestamp) {
            latest = all[key];
            latestKey = key;
          }
        }
      });
      sendResponse(latest);
    });
    return true;
  }

  if (request.type === 'SAVE_PROFILE') {
    chrome.storage.local.set({
      ['profile_' + request.username]: {
        data: request.data,
        platform: request.platform,
        username: request.username,
        timestamp: Date.now()
      }
    }, function() {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'GET_LATEST_PROFILE') {
    chrome.storage.local.get(null, function(all) {
      let latest = null;
      Object.keys(all).forEach(function(key) {
        if (key.startsWith('profile_')) {
          if (!latest || all[key].timestamp > latest.timestamp) {
            latest = all[key];
          }
        }
      });
      sendResponse(latest);
    });
    return true;
  }

  // 采集进度
  if (request.type === 'COLLECT_PROGRESS') {
    collectProgress = request.message;
    sendResponse({ success: true });
    return true;
  }
  if (request.type === 'GET_COLLECT_PROGRESS') {
    sendResponse({ message: collectProgress });
    return true;
  }

  // === 通过链接获取用户画像 ===
  if (request.type === 'FETCH_PROFILE_BY_URL') {
    (async function() {
      try {
        var url = request.url || '';
        var uidMatch = url.match(/space\.bilibili\.com\/(\d+)/) || url.match(/(\d+)/);
        var uid = uidMatch ? uidMatch[1] : '';
        if (!uid) {
          sendResponse({ success: false, error: '无法从链接中提取用户ID，请输入B站用户主页链接' });
          return;
        }

        var showProgress = function(msg) {
          try { chrome.runtime.sendMessage({ type: 'COLLECT_PROGRESS', message: msg }); } catch (e) {}
        };

        // 1. 获取用户信息（多端点回退）
        showProgress('正在获取用户信息...');
        var nickname = '', bio = '', avatar = '', followers = 0, following = 0, totalLikes = 0;

        // 端点1: web-interface/card（不需要WBI签名）
        try {
          var cardResp = await fetch('https://api.bilibili.com/x/web-interface/card?mid=' + uid + '&photo=true', { credentials: 'include' });
          var cardJson = await cardResp.json();
          if (cardJson.code === 0 && cardJson.data) {
            var card = cardJson.data.card || {};
            if (!nickname) nickname = card.name || '';
            if (!bio) bio = card.sign || '';
            if (!avatar) avatar = card.face || '';
            if (cardJson.data.follower) followers = cardJson.data.follower;
            if (cardJson.data.following) following = cardJson.data.following;
            if (cardJson.data.like_num) totalLikes = cardJson.data.like_num;
          }
        } catch (e) {}

        // 端点2: space/wbi/acc/info（可能需要WBI签名，但已登录时可能有效）
        if (!nickname) {
          try {
            var infoResp = await fetch('https://api.bilibili.com/x/space/wbi/acc/info?mid=' + uid, { credentials: 'include' });
            var infoJson = await infoResp.json();
            if (infoJson.code === 0 && infoJson.data) {
              nickname = infoJson.data.name || '';
              bio = infoJson.data.sign || '';
              avatar = infoJson.data.face || '';
              if (infoJson.data.like_num) totalLikes = infoJson.data.like_num;
            }
          } catch (e) {}
        }

        // 端点3: space/acc/info（旧版，不需要WBI）
        if (!nickname) {
          try {
            var infoResp2 = await fetch('https://api.bilibili.com/x/space/acc/info?mid=' + uid, { credentials: 'include' });
            var infoJson2 = await infoResp2.json();
            if (infoJson2.code === 0 && infoJson2.data) {
              nickname = infoJson2.data.name || '';
              bio = infoJson2.data.sign || bio;
              avatar = infoJson2.data.face || avatar;
              if (infoJson2.data.like_num) totalLikes = infoJson2.data.like_num;
            }
          } catch (e) {}
        }

        // 2. 获取粉丝/关注数（如果card API未返回）
        if (!followers) {
          showProgress('正在获取粉丝数据...');
          try {
            var relResp = await fetch('https://api.bilibili.com/x/relation/stat?vmid=' + uid, { credentials: 'include' });
            var relJson = await relResp.json();
            if (relJson.code === 0 && relJson.data) {
              followers = relJson.data.follower || 0;
              following = relJson.data.following || 0;
            }
          } catch (e) {}
        }

        // 3. 如果仍未获取到昵称，尝试从动态流提取
        if (!nickname) {
          try {
            var dynResp = await fetch('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + uid + '&page=1&_=' + Date.now(), { credentials: 'include' });
            var dynJson = await dynResp.json();
            if (dynJson.code === 0 && dynJson.data && dynJson.data.items && dynJson.data.items.length > 0) {
              var authorModule = (dynJson.data.items[0].modules || {}).module_author || {};
              nickname = authorModule.name || '';
              if (!avatar) avatar = authorModule.face || '';
              if (!bio && authorModule.pendant) bio = '';
            }
          } catch (e) {}
        }

        // 3. 获取视频列表（多端点分页）
        showProgress('正在获取视频列表...');
        var videos = [];
        var seen = {};
        function addVideo(v) { if (v.bvid && !seen[v.bvid]) { seen[v.bvid] = 1; videos.push(v); } }

        // 端点1: wbi/arc/search
        for (var pn = 1; pn <= 3; pn++) {
          try {
            var resp = await fetch('https://api.bilibili.com/x/space/wbi/arc/search?mid=' + uid + '&ps=30&pn=' + pn + '&order=pubdate&_=' + Date.now(), { credentials: 'include' });
            var json = await resp.json();
            if (json.code === 0 && json.data && json.data.list && json.data.list.vlist && json.data.list.vlist.length > 0) {
              json.data.list.vlist.forEach(function(v) {
                var d = v.created ? new Date(v.created * 1000) : new Date();
                addVideo({
                  title: v.title || '', bvid: v.bvid || '', aid: v.aid || 0,
                  plays: v.play || 0, likes: 0, comments: v.video_review || 0,
                  date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
                  month: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
                  timestamp: v.created || 0, cover: v.pic || '', length: v.length || '', description: v.description || ''
                });
              });
              if (json.data.list.vlist.length < 30) break;
              await new Promise(function(r) { setTimeout(r, 300); });
            } else break;
          } catch (e) { break; }
        }

        // 端点2: arc/search
        if (videos.length === 0) {
          for (var pn2 = 1; pn2 <= 3; pn2++) {
            try {
              var resp2 = await fetch('https://api.bilibili.com/x/space/arc/search?mid=' + uid + '&ps=30&pn=' + pn2 + '&order=pubdate&jsonp=jsonp&_=' + Date.now(), { credentials: 'include' });
              var json2 = await resp2.json();
              if (json2.code === 0 && json2.data && json2.data.list && json2.data.list.vlist && json2.data.list.vlist.length > 0) {
                json2.data.list.vlist.forEach(function(v) {
                  var d = v.created ? new Date(v.created * 1000) : new Date();
                  addVideo({ title: v.title || '', bvid: v.bvid || '', aid: v.aid || 0, plays: v.play || 0, likes: 0, comments: v.video_review || 0, date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), month: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), timestamp: v.created || 0, cover: v.pic || '', length: v.length || '', description: v.description || '' });
                });
                if (json2.data.list.vlist.length < 30) break;
                await new Promise(function(r) { setTimeout(r, 300); });
              } else break;
            } catch (e) { break; }
          }
        }

        // 端点3: 动态流
        if (videos.length === 0) {
          var offset = '';
          for (var page = 0; page < 5; page++) {
            try {
              var resp3 = await fetch('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + uid + '&offset=' + offset + '&page=' + (page + 1) + '&_=' + Date.now(), { credentials: 'include' });
              var json3 = await resp3.json();
              if (json3.code === 0 && json3.data && json3.data.items) {
                json3.data.items.forEach(function(item) {
                  var major = (item.modules || {}).module_dynamic || {}; major = major.major || {};
                  if (major.type === 'MAJOR_TYPE_ARCHIVE' && major.archive) {
                    var arc = major.archive;
                    addVideo({ title: arc.title || '', bvid: arc.bvid || '', aid: arc.aid || 0, plays: 0, likes: 0, comments: 0, date: '', month: '', timestamp: 0, cover: arc.cover || '', length: arc.duration_text || '', description: arc.desc || '' });
                  }
                });
                if (json3.data.offset) offset = json3.data.offset;
                if (!json3.data.has_more) break;
                await new Promise(function(r) { setTimeout(r, 300); });
              } else break;
            } catch (e) { break; }
          }
        }

        // 4. 补充视频详情
        if (videos.length > 0) {
          showProgress('正在获取视频详情 (' + Math.min(videos.length, 30) + ' 个)...');
          var topVideos = videos.slice(0, 30);
          for (var i = 0; i < topVideos.length; i++) {
            if (!topVideos[i].bvid) continue;
            try {
              var vResp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + topVideos[i].bvid, { credentials: 'include' });
              var vJson = await vResp.json();
              if (vJson.code === 0 && vJson.data) {
                var stat = vJson.data.stat || {};
                topVideos[i].aid = stat.aid || topVideos[i].aid;
                topVideos[i].plays = stat.view || topVideos[i].plays;
                topVideos[i].likes = stat.like || 0;
                topVideos[i].comments = stat.reply || topVideos[i].comments;
                topVideos[i].title = vJson.data.title || topVideos[i].title;
                topVideos[i].cover = vJson.data.pic || '';
                if (vJson.data.pubdate) {
                  var d = new Date(vJson.data.pubdate * 1000);
                  topVideos[i].timestamp = vJson.data.pubdate;
                  topVideos[i].date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                  topVideos[i].month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                }
              }
            } catch (e) {}
            await new Promise(function(r) { setTimeout(r, 200); });
          }
        }

        // 5. 采集评论
        var allComments = [];
        var userStats = {};
        if (videos.length > 0) {
          showProgress('正在采集评论数据...');
          var sorted = videos.slice().sort(function(a, b) { return (b.plays || b.comments || 0) - (a.plays || a.comments || 0); });
          var topV = sorted.slice(0, 5).filter(function(v) { return v.aid; });

          for (var j = 0; j < topV.length; j++) {
            for (var page2 = 1; page2 <= 2; page2++) {
              try {
                var replyUrl = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + topV[j].aid + '&ps=30&pn=' + page2 + '&mode=3&_=' + Date.now();
                var replyResp = await fetch(replyUrl, { credentials: 'include' });
                var replyJson = await replyResp.json();
                if (replyJson.code !== 0 || !replyJson.data || !replyJson.data.replies) break;
                var replies = replyJson.data.replies;
                if (replies.length === 0) break;
                replies.forEach(function(r) {
                  if (!r.content || !r.content.message) return;
                  var member = r.member || {};
                  var cleanText = cleanCommentText(r.content.message);
                  if (!cleanText) return;
                  allComments.push({ user: member.uname || '匿名', mid: member.mid || r.mid || 0, text: cleanText, likes: r.like || 0, replies: r.count || 0 });
                  var key = member.mid || r.mid;
                  if (!userStats[key]) { userStats[key] = { user: member.uname || '匿名', commentCount: 0, totalLikes: 0, comments: [] }; }
                  userStats[key].commentCount++;
                  userStats[key].totalLikes += (r.like || 0);
                  if (userStats[key].comments.length < 3) userStats[key].comments.push({ text: cleanText, likes: r.like || 0, videoTitle: topV[j].title });
                });
              } catch (e) { break; }
              await new Promise(function(r) { setTimeout(r, 200); });
            }
            await new Promise(function(r) { setTimeout(r, 300); });
          }
        }

        // 6. 构建排行
        var userArr = Object.values(userStats);
        var likeRanking = userArr.filter(function(u) { return u.totalLikes > 0; }).sort(function(a, b) { return b.totalLikes - a.totalLikes; }).slice(0, 10).map(function(u, i) { return { rank: i + 1, user: u.user, likes: u.totalLikes, commentSample: u.comments[0] || { text: '' } }; });
        var commentRanking = userArr.filter(function(u) { return u.commentCount > 0; }).sort(function(a, b) { return b.commentCount - a.commentCount; }).slice(0, 10).map(function(u, i) { return { rank: i + 1, user: u.user, comments: u.commentCount, replies: 0, commentSample: u.comments[0] || { text: '' } }; });

        var totalVideoLikes = videos.reduce(function(s, v) { return s + (v.likes || 0); }, 0);
        var totalVideoPlays = videos.reduce(function(s, v) { return s + (v.plays || 0); }, 0);

        sendResponse({
          success: true,
          profile: {
            nickname: nickname || 'B站用户', uid: uid, bio: bio, avatar: avatar,
            platform: 'bilibili', followers: followers, following: following,
            accountLikes: totalLikes || totalVideoLikes, totalPlays: totalVideoPlays,
            videoCount: videos.length, videos: videos,
            totalVideoLikes: totalVideoLikes, avgVideoLikes: videos.length > 0 ? Math.round(totalVideoLikes / videos.length) : 0,
            totalVideoPlays: totalVideoPlays, avgVideoPlays: videos.length > 0 ? Math.round(totalVideoPlays / videos.length) : 0,
            allComments: allComments, likeRanking: likeRanking, commentRanking: commentRanking,
            url: url, timestamp: Date.now()
          }
        });
      } catch (e) {
        sendResponse({ success: false, error: '获取失败: ' + e.message });
      }
    })();
    return true;
  }

  // === 通过链接获取视频评论 ===
  if (request.type === 'FETCH_VIDEO_COMMENTS_BY_URL') {
    (async function() {
      try {
        var url = request.url || '';
        var bvMatch = url.match(/BV[a-zA-Z0-9]{10}/);
        var bvid = bvMatch ? bvMatch[0] : '';
        if (!bvid) {
          sendResponse({ success: false, error: '无法从链接中提取视频BV号，请输入B站视频链接' });
          return;
        }

        var showProgress = function(msg) {
          try { chrome.runtime.sendMessage({ type: 'COLLECT_PROGRESS', message: msg }); } catch (e) {}
        };

        // 1. 获取视频信息
        showProgress('正在获取视频信息...');
        var videoTitle = '', videoAuthor = '', aid = 0, videoViews = 0, videoLikes = 0, videoReplies = 0, videoPubdate = '';
        try {
          var viewResp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid, { credentials: 'include' });
          var viewJson = await viewResp.json();
          if (viewJson.code === 0 && viewJson.data) {
            videoTitle = viewJson.data.title || '';
            videoAuthor = (viewJson.data.owner && viewJson.data.owner.name) || '';
            aid = (viewJson.data.stat && viewJson.data.stat.aid) || viewJson.data.aid || 0;
            videoViews = (viewJson.data.stat && viewJson.data.stat.view) || 0;
            videoLikes = (viewJson.data.stat && viewJson.data.stat.like) || 0;
            videoReplies = (viewJson.data.stat && viewJson.data.stat.reply) || 0;
            if (viewJson.data.pubdate) {
              var pd = new Date(viewJson.data.pubdate * 1000);
              videoPubdate = pd.getFullYear() + '-' + String(pd.getMonth() + 1).padStart(2, '0') + '-' + String(pd.getDate()).padStart(2, '0');
            }
          }
        } catch (e) {}

        if (!aid) {
          sendResponse({ success: false, error: '无法获取视频信息，请检查链接是否正确' });
          return;
        }

        // 2. 获取评论（多页）
        showProgress('正在获取评论数据...');
        var comments = [];
        for (var page = 1; page <= 10; page++) {
          try {
            showProgress('正在获取评论 (第' + page + '页)...');
            var replyUrl = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + aid + '&ps=30&pn=' + page + '&mode=3&_=' + Date.now();
            var replyResp = await fetch(replyUrl, { credentials: 'include' });
            var replyJson = await replyResp.json();
            if (replyJson.code !== 0 || !replyJson.data || !replyJson.data.replies) break;
            var replies = replyJson.data.replies;
            if (replies.length === 0) break;

            replies.forEach(function(r) {
              if (!r.content || !r.content.message) return;
              var member = r.member || {};
              var cleanText = cleanCommentText(r.content.message);
              if (!cleanText) return;
              var d = r.ctime ? new Date(r.ctime * 1000) : new Date();
              comments.push({
                user: member.uname || '匿名用户',
                mid: member.mid || r.mid || 0,
                avatar: member.avatar || '',
                text: cleanText,
                likes: r.like || 0,
                replies: r.count || 0,
                time: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
                timestamp: r.ctime || 0,
                level: member.level_info ? member.level_info.current_level || 0 : 0,
                vip: member.vip ? member.vip.vipType || 0 : 0,
                sentiment: 'neutral'
              });
            });

            showProgress('已获取 ' + comments.length + ' 条评论...');
            if (replies.length < 30) break;
            await new Promise(function(r) { setTimeout(r, 200); });
          } catch (e) { break; }
        }

        sendResponse({
          success: true,
          data: comments,
          videoId: bvid,
          videoTitle: videoTitle,
          videoAuthor: videoAuthor,
          videoViews: videoViews,
          videoLikes: videoLikes,
          videoReplies: videoReplies,
          videoPubdate: videoPubdate,
          platform: 'bilibili'
        });
      } catch (e) {
        sendResponse({ success: false, error: '获取失败: ' + e.message });
      }
    })();
    return true;
  }
});
