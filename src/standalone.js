// 独立模式：不依赖扩展background.js，直接从网页调用B站API
// 用于Vercel部署的网页版仪表盘

function cleanCommentText(text) {
  if (!text) return '';
  text = String(text);
  text = text.replace(/https?:\/\/[^\s"'<>]+/gi, '');
  text = text.replace(/[a-zA-Z0-9\/_\-]{6,}\.(jpg|jpeg|png|gif|webp|bmp)/gi, '');
  text = text.replace(/<img[^>]*>/gi, '');
  text = text.replace(/\[img[^\]]*\]/gi, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function formatDate(ts) {
  if (!ts) return '';
  var d = new Date(ts * 1000);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatMonth(ts) {
  if (!ts) return '';
  var d = new Date(ts * 1000);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// 通过链接获取用户画像
async function fetchProfileByUrl(url) {
  var uidMatch = url.match(/space\.bilibili\.com\/(\d+)/) || url.match(/(\d+)/);
  var uid = uidMatch ? uidMatch[1] : '';
  if (!uid) {
    return { success: false, error: '无法从链接中提取用户ID，请输入B站用户主页链接' };
  }

  var nickname = '', bio = '', avatar = '', followers = 0, following = 0, totalLikes = 0;

  // 端点1: web-interface/card（不需要WBI签名）
  try {
    var cardResp = await fetch('https://api.bilibili.com/x/web-interface/card?mid=' + uid + '&photo=true');
    var cardJson = await cardResp.json();
    if (cardJson.code === 0 && cardJson.data) {
      var card = cardJson.data.card || {};
      nickname = card.name || '';
      bio = card.sign || '';
      avatar = card.face || '';
      followers = card.fans || 0;
      following = card.attention || 0;
      totalLikes = (cardJson.data.likes) || 0;
    }
  } catch (e) {}

  // 端点2: relation/stat
  if (!followers) {
    try {
      var relResp = await fetch('https://api.bilibili.com/x/relation/stat?vmid=' + uid);
      var relJson = await relResp.json();
      if (relJson.code === 0 && relJson.data) {
        followers = relJson.data.follower || 0;
        following = relJson.data.following || 0;
      }
    } catch (e) {}
  }

  if (!nickname) {
    return { success: false, error: '无法获取用户信息，请检查链接是否正确' };
  }

  // 获取视频列表（多端点分页）
  var videos = [];
  var seen = {};
  function addVideo(v) { if (v.bvid && !seen[v.bvid]) { seen[v.bvid] = 1; videos.push(v); } }

  // 端点1: wbi/arc/search
  for (var pn = 1; pn <= 3; pn++) {
    try {
      var resp = await fetch('https://api.bilibili.com/x/space/wbi/arc/search?mid=' + uid + '&ps=30&pn=' + pn + '&order=pubdate&_=' + Date.now());
      var json = await resp.json();
      if (json.code === 0 && json.data && json.data.list && json.data.list.vlist && json.data.list.vlist.length > 0) {
        json.data.list.vlist.forEach(function(v) {
          var d = v.created ? new Date(v.created * 1000) : new Date();
          addVideo({
            title: v.title || '', bvid: v.bvid || '', aid: v.aid || 0,
            plays: v.play || 0, likes: 0, comments: v.video_review || 0,
            date: formatDate(v.created), month: formatMonth(v.created),
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
        var resp2 = await fetch('https://api.bilibili.com/x/space/arc/search?mid=' + uid + '&ps=30&pn=' + pn2 + '&order=pubdate&jsonp=jsonp&_=' + Date.now());
        var json2 = await resp2.json();
        if (json2.code === 0 && json2.data && json2.data.list && json2.data.list.vlist && json2.data.list.vlist.length > 0) {
          json2.data.list.vlist.forEach(function(v) {
            var d = v.created ? new Date(v.created * 1000) : new Date();
            addVideo({
              title: v.title || '', bvid: v.bvid || '', aid: v.aid || 0,
              plays: v.play || 0, likes: 0, comments: v.video_review || 0,
              date: formatDate(v.created), month: formatMonth(v.created),
              timestamp: v.created || 0, cover: v.pic || '', length: v.length || '', description: v.description || ''
            });
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
        var resp3 = await fetch('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + uid + '&offset=' + offset + '&page=' + (page + 1) + '&_=' + Date.now());
        var json3 = await resp3.json();
        if (json3.code === 0 && json3.data && json3.data.items) {
          json3.data.items.forEach(function(item) {
            var major = (item.modules || {}).module_dynamic || {}; major = major.major || {};
            if (major.type === 'MAJOR_TYPE_ARCHIVE' && major.archive) {
              var arc = major.archive;
              addVideo({
                title: arc.title || '', bvid: arc.bvid || '', aid: arc.aid || 0,
                plays: 0, likes: 0, comments: 0,
                date: '', month: '', timestamp: 0,
                cover: arc.cover || '', length: arc.duration_text || '', description: arc.desc || ''
              });
            }
          });
          if (json3.data.offset) offset = json3.data.offset;
          if (!json3.data.has_more) break;
          await new Promise(function(r) { setTimeout(r, 300); });
        } else break;
      } catch (e) { break; }
    }
  }

  // 补充视频详情
  if (videos.length > 0) {
    var topVideos = videos.slice(0, 30);
    for (var i = 0; i < topVideos.length; i++) {
      if (!topVideos[i].bvid) continue;
      try {
        var vResp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + topVideos[i].bvid);
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
            topVideos[i].timestamp = vJson.data.pubdate;
            topVideos[i].date = formatDate(vJson.data.pubdate);
            topVideos[i].month = formatMonth(vJson.data.pubdate);
          }
        }
      } catch (e) {}
      await new Promise(function(r) { setTimeout(r, 200); });
    }
  }

  // 采集评论
  var allComments = [];
  var userStats = {};
  if (videos.length > 0) {
    var sorted = videos.slice().sort(function(a, b) { return (b.plays || b.comments || 0) - (a.plays || a.comments || 0); });
    var topV = sorted.slice(0, 5).filter(function(v) { return v.aid; });

    for (var j = 0; j < topV.length; j++) {
      for (var page2 = 1; page2 <= 2; page2++) {
        try {
          var replyUrl = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + topV[j].aid + '&ps=30&pn=' + page2 + '&mode=3&_=' + Date.now();
          var replyResp = await fetch(replyUrl);
          var replyJson = await replyResp.json();
          if (replyJson.code !== 0 || !replyJson.data || !replyJson.data.replies) break;
          var replies = replyJson.data.replies;
          if (replies.length === 0) break;
          replies.forEach(function(r) {
            if (!r.content || !r.content.message) return;
            var member = r.member || {};
            var text = cleanCommentText(r.content.message);
            if (!text) return;
            allComments.push({ user: member.uname || '匿名', mid: member.mid || r.mid || 0, text: text, likes: r.like || 0, replies: r.count || 0 });
            var key = member.mid || r.mid;
            if (!userStats[key]) { userStats[key] = { user: member.uname || '匿名', commentCount: 0, totalLikes: 0, comments: [] }; }
            userStats[key].commentCount++;
            userStats[key].totalLikes += (r.like || 0);
            if (userStats[key].comments.length < 3) userStats[key].comments.push({ text: text, likes: r.like || 0, videoTitle: topV[j].title });
          });
        } catch (e) { break; }
        await new Promise(function(r) { setTimeout(r, 200); });
      }
      await new Promise(function(r) { setTimeout(r, 300); });
    }
  }

  // 构建排行
  var userArr = Object.values(userStats);
  var likeRanking = userArr.filter(function(u) { return u.totalLikes > 0; }).sort(function(a, b) { return b.totalLikes - a.totalLikes; }).slice(0, 10).map(function(u, i) { return { rank: i + 1, user: u.user, likes: u.totalLikes, commentSample: u.comments[0] || { text: '' } }; });
  var commentRanking = userArr.filter(function(u) { return u.commentCount > 0; }).sort(function(a, b) { return b.commentCount - a.commentCount; }).slice(0, 10).map(function(u, i) { return { rank: i + 1, user: u.user, comments: u.commentCount, replies: 0, commentSample: u.comments[0] || { text: '' } }; });

  var totalVideoLikes = videos.reduce(function(s, v) { return s + (v.likes || 0); }, 0);
  var totalVideoPlays = videos.reduce(function(s, v) { return s + (v.plays || 0); }, 0);

  return {
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
  };
}

// 通过链接获取视频评论
async function fetchVideoCommentsByUrl(url) {
  var bvMatch = url.match(/BV[a-zA-Z0-9]{10}/);
  var bvid = bvMatch ? bvMatch[0] : '';
  if (!bvid) {
    return { success: false, error: '无法从链接中提取视频BV号，请输入B站视频链接' };
  }

  var videoTitle = '', videoAuthor = '', aid = 0, videoViews = 0, videoLikes = 0, videoReplies = 0, videoPubdate = 0;

  try {
    var viewResp = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid);
    var viewJson = await viewResp.json();
    if (viewJson.code === 0 && viewJson.data) {
      videoTitle = viewJson.data.title || '';
      videoAuthor = (viewJson.data.owner && viewJson.data.owner.name) || '';
      aid = viewJson.data.aid || 0;
      videoViews = (viewJson.data.stat && viewJson.data.stat.view) || 0;
      videoLikes = (viewJson.data.stat && viewJson.data.stat.like) || 0;
      videoReplies = (viewJson.data.stat && viewJson.data.stat.reply) || 0;
      videoPubdate = viewJson.data.pubdate || 0;
    }
  } catch (e) {}

  if (!aid) {
    return { success: false, error: '无法获取视频信息，请检查链接是否正确' };
  }

  var comments = [];
  for (var page = 1; page <= 10; page++) {
    try {
      var replyUrl = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + aid + '&ps=30&pn=' + page + '&mode=3&_=' + Date.now();
      var replyResp = await fetch(replyUrl);
      var replyJson = await replyResp.json();
      if (replyJson.code !== 0 || !replyJson.data || !replyJson.data.replies) break;
      var replies = replyJson.data.replies;
      if (replies.length === 0) break;

      replies.forEach(function(r) {
        if (!r.content || !r.content.message) return;
        var member = r.member || {};
        var text = cleanCommentText(r.content.message);
        if (!text) return;
        comments.push({
          user: member.uname || '匿名用户',
          mid: member.mid || r.mid || 0,
          avatar: '📹',
          text: text,
          likes: r.like || 0,
          replies: r.count || 0,
          time: formatDate(r.ctime),
          timestamp: r.ctime || 0,
          level: member.level_info ? member.level_info.current_level || 0 : 0,
          vip: member.vip ? member.vip.vipType || 0 : 0,
          sentiment: 'neutral'
        });
      });

      if (replies.length < 30) break;
      await new Promise(function(r) { setTimeout(r, 200); });
    } catch (e) { break; }
  }

  return {
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
  };
}

export { fetchProfileByUrl, fetchVideoCommentsByUrl };
