import { generateUserProfile, generateVideoAnalysis, platformConfig } from './mockData.js';
import { analyzeComments, extractKeywords, identifyKOLs, analyzeSentiment } from './sentiment.js';
import { fetchProfileByUrl, fetchVideoCommentsByUrl } from './standalone.js';
import * as echarts from 'echarts';
import { chinaGeoJson } from './chinaMap.js';
import {
  renderProfileTrendChart,
  renderProfileInterestChart,
  renderProfileSentimentChart,
  renderProfileWordCloudChart,
  renderProfileRelationChart,
  renderProfileLocationChart,
  renderSentimentPieChart,
  renderSentimentTrendChart,
  renderWordCloudChart
} from './charts.js';

let chinaMapLoaded = false;

async function loadChinaMap() {
  if (chinaMapLoaded) return;
  try {
    const resp = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
    if (resp.ok) {
      const geoJson = await resp.json();
      var filtered = geoJson.features.filter(function(f) {
        var nm = (f.properties && f.properties.name) || '';
        return nm.indexOf('南海') === -1;
      });
      echarts.registerMap('china', { type: geoJson.type, features: filtered });
      chinaMapLoaded = true;
      return;
    }
  } catch (e) {
    console.warn('从DataV API加载地图失败，使用本地地图数据:', e);
  }
  try {
    echarts.registerMap('china', chinaGeoJson);
    chinaMapLoaded = true;
  } catch (e) {
    console.error('注册中国地图失败:', e);
  }
}

const $ = (id) => document.getElementById(id);

function showToast(message, type = 'info') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading(text = '正在分析中...') {
  $('loadingText').textContent = text;
  $('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  $('loadingOverlay').style.display = 'none';
}

function showProgressForProfile(msg) {
  var el = $('loadingText');
  if (el) el.textContent = msg;
}

function showProgressForVideo(msg) {
  var el = $('loadingText');
  if (el) el.textContent = msg;
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tab}`);
  });
}

function renderProfileResult(profile) {
  $('profileResultPanel').style.display = 'block';

  const platform = platformConfig[profile.platform];
  $('profileAvatar').textContent = platform.icon;
  $('profileName').textContent = profile.username;
  $('profileMeta').innerHTML = `
    <span>${platform.name}</span>
    <span>ID: ${profile.username}</span>
    <span>分析范围: 近${profile.range === 'all' ? '全部' : profile.range + '天'}</span>
  `;

  $('profileTags').innerHTML = profile.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

  $('profileLevel').textContent = profile.level;
  $('profileLevel').style.background = `linear-gradient(135deg, ${profile.levelColor}, ${profile.levelColor}dd)`;

  $('statPosts').textContent = profile.posts.toLocaleString();
  $('statComments').textContent = profile.comments.toLocaleString();
  $('statForwards').textContent = profile.forwards.toLocaleString();
  $('statLikes').textContent = profile.likes.toLocaleString();
  $('statFans').textContent = profile.fans.toLocaleString();

  renderProfileTrendChart(profile.trendData, profile.trendLabels);

  // 兴趣分布：统一转为对象格式
  var interestData = profile.interestDistribution;
  if (Array.isArray(interestData)) {
    var obj = {};
    interestData.forEach(function(item) { obj[item.name] = item.value; });
    interestData = obj;
  }
  renderProfileInterestChart(interestData);

  renderProfileSentimentChart(profile.sentiment);
  renderProfileWordCloudChart(profile.postWordCloudData);

  $('profileTopics').innerHTML = profile.participatedTopics.map(t => `
    <div class="topic-tag topic-${t.category}">
      <span class="topic-name">${t.name}</span>
      <span class="topic-count">${t.count}次</span>
      <span class="topic-cat">${t.category}</span>
    </div>
  `).join('');

  // 关系图：空数据时显示提示
  if (profile.relNodes && profile.relNodes.length > 0) {
    renderProfileRelationChart({ nodes: profile.relNodes, links: profile.relLinks });
  } else {
    var relChart = document.getElementById('profileRelationChart');
    if (relChart) {
      relChart.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">暂无关联关系数据<br><span style="font-size:12px;color:#bbb;">（需采集评论中的@互动数据）</span></div>';
    }
  }

  $('profileLikeRanking').innerHTML = profile.likeRanking.length > 0 ? profile.likeRanking.map(item => `
    <div class="ranking-item">
      <div class="ranking-num">${item.rank}</div>
      <div class="ranking-avatar">${item.user.charAt(0)}</div>
      <div class="ranking-info">
        <div class="ranking-name">${item.user}</div>
        <div class="ranking-desc">${item.likes} 次点赞</div>
      </div>
      <div class="ranking-bar">
        <div class="ranking-bar-fill" style="width: ${(item.likes / profile.likeRanking[0].likes * 100).toFixed(1)}%"></div>
      </div>
    </div>
  `).join('') : '<div style="text-align:center;padding:30px;color:#999;">暂无排行数据</div>';

  $('profileCommentRanking').innerHTML = profile.commentRanking.length > 0 ? profile.commentRanking.map(item => `
    <div class="ranking-item">
      <div class="ranking-num">${item.rank}</div>
      <div class="ranking-avatar">${item.user.charAt(0)}</div>
      <div class="ranking-info">
        <div class="ranking-name">${item.user}</div>
        <div class="ranking-desc">发出 ${item.comments} 条 / 收到 ${item.replies} 条</div>
      </div>
      <div class="ranking-bar">
        <div class="ranking-bar-fill" style="width: ${(item.comments / profile.commentRanking[0].comments * 100).toFixed(1)}%"></div>
      </div>
    </div>
  `).join('') : '<div style="text-align:center;padding:30px;color:#999;">暂无排行数据</div>';

  // 地图：空数据时显示提示
  if (profile.videoLocations && profile.videoLocations.length > 0) {
    renderProfileLocationChart(profile.videoLocations);
  } else {
    var mapChart = document.getElementById('profileLocationChart');
    if (mapChart) {
      mapChart.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">暂无地理分布数据</div>';
    }
  }

  const overseaLocations = profile.videoLocations ? profile.videoLocations.filter(function(l) { return l.isOversea; }) : [];
  const overseaEl = $('profileOverseaList');
  if (overseaLocations.length > 0 && overseaEl) {
    const tagsHtml = overseaLocations.map(function(l) {
      return '<span class="oversea-tag">' + l.name + ' ' + l.count + '次</span>';
    }).join('');
    overseaEl.innerHTML = '<div class="oversea-title">🌏 海外：</div>' + tagsHtml;
    overseaEl.style.display = 'flex';
  } else if (overseaEl) {
    overseaEl.style.display = 'none';
  }

  $('profileSummary').textContent = profile.summary;
}

function renderVideoResult(result) {
  $('videoResultPanel').style.display = 'block';

  const platform = platformConfig[result.platform] || platformConfig.bilibili;
  $('videoTitle').textContent = result.videoTitle;
  $('videoAuthor').textContent = `${platform.icon} ${platform.name} · ${result.videoAuthor}`;
  $('videoStats').textContent = '📊 ' + result.videoStats;
  $('videoPublishTime').textContent = '🕐 ' + result.publishTime;

  const total = result.sentiment.positive + result.sentiment.neutral + result.sentiment.negative;
  $('sentPositive').textContent = result.sentiment.positive + '%';
  $('sentNeutral').textContent = result.sentiment.neutral + '%';
  $('sentNegative').textContent = result.sentiment.negative + '%';

  const totalComments = result.sentimentCounts.positive + result.sentimentCounts.neutral + result.sentimentCounts.negative;
  $('countPositive').textContent = result.sentimentCounts.positive.toLocaleString() + ' 条评论';
  $('countNeutral').textContent = result.sentimentCounts.neutral.toLocaleString() + ' 条评论';
  $('countNegative').textContent = result.sentimentCounts.negative.toLocaleString() + ' 条评论';

  renderSentimentPieChart(result.sentiment);
  renderSentimentTrendChart(result.trendData);

  renderWordCloudChart(result.hotTopics);

  $('hotTopicsList').innerHTML = result.hotTopics.slice(0, 10).map((t, i) => `
    <div class="hot-topic" data-topic="${t.topic}">
      <span class="rank">#${i + 1}</span>
      <span class="topic-name">${t.topic}</span>
      <span class="count">${t.count}次</span>
    </div>
  `).join('');

  const sentLabels = { positive: '正面', neutral: '中性', negative: '负面' };
  const sentColors = { positive: '#52c41a', neutral: '#8c8c8c', negative: '#ff4757' };

  $('kolList').innerHTML = result.kols.map(k => `
    <div class="kol-item" data-comments="${k.comments}" data-likes="${k.likes}">
      <div class="kol-rank">${k.rank}</div>
      <div class="kol-avatar">${k.name.charAt(0)}</div>
      <div class="kol-info">
        <div class="kol-name">
          ${k.name}
          ${k.verified ? '<span style="color:#00d4ff;margin-left:6px">✓</span>' : ''}
        </div>
        <div class="kol-desc">${k.bio} · 粉丝 ${k.fans.toLocaleString()}</div>
        <div class="kol-comment-sample">
          <span class="kol-comment-text">${k.commentSample.text}</span>
          <span class="kol-comment-meta">
            <span style="color:${sentColors[k.commentSample.sentiment]}">${sentLabels[k.commentSample.sentiment]}</span>
            · 👍 ${k.commentSample.likes} · ${k.commentSample.time}
          </span>
        </div>
      </div>
      <div class="kol-stats-wrap">
        <div class="kol-stat">
          <div class="kol-stat-num">${k.comments}</div>
          <div class="kol-stat-label">评论数</div>
        </div>
        <div class="kol-stat">
          <div class="kol-stat-num">${k.likes}</div>
          <div class="kol-stat-label">获赞数</div>
        </div>
      </div>
    </div>
  `).join('');

  $('commentSampleCount').textContent = `(共 ${result.comments.length} 条样本)`;
  renderCommentList(result.comments, 'all');

  function sortKOLList(sortBy) {
    const container = $('kolList');
    const items = Array.from(container.querySelectorAll('.kol-item'));
    items.sort((a, b) => {
      const aVal = parseInt(a.dataset[sortBy] || '0');
      const bVal = parseInt(b.dataset[sortBy] || '0');
      return bVal - aVal;
    });
    container.innerHTML = '';
    items.forEach((item, idx) => {
      const rankEl = item.querySelector('.kol-rank');
      if (rankEl) rankEl.textContent = idx + 1;
      container.appendChild(item);
    });
  }

  $('kolSort').onchange = (e) => sortKOLList(e.target.value);
  sortKOLList($('kolSort').value);

  $('sentimentFilter').onchange = (e) => {
    renderCommentList(result.comments, e.target.value);
  };
}

function renderCommentList(comments, filter) {
  let filtered = comments;
  if (filter !== 'all') {
    filtered = comments.filter(c => c.sentiment === filter);
  }

  const sentLabels = { positive: '正面', neutral: '中性', negative: '负面' };

  $('commentList').innerHTML = filtered.slice(0, 50).map(c => {
    var displayText = (c.text || '').replace(/https?:\/\/[^\s]+/gi, '').replace(/[a-zA-Z0-9\/_\-]{6,}\.(jpg|jpeg|png|gif|webp|bmp)/gi, '').replace(/\s+/g, ' ').trim();
    var avatarIcon = c.avatar && !/^https?:\/\//.test(c.avatar) ? c.avatar : '📹';
    return `
    <div class="comment-item ${c.sentiment}">
      <div class="comment-avatar">${avatarIcon}</div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-user">
            ${c.user}
            ${c.isKOL ? '<span style="color:#ff4757;margin-left:4px;font-size:11px;">KOL</span>' : ''}
            ${c.userTag ? `<span style="margin-left:4px;font-size:10px;background:#f0f0f0;padding:1px 6px;border-radius:8px;color:#666;">${c.userTag}</span>` : ''}
          </span>
          <span class="comment-time">${c.time}</span>
          <span class="comment-sentiment ${c.sentiment}">${sentLabels[c.sentiment]}</span>
        </div>
        <div class="comment-text">${displayText}</div>
        <div class="comment-actions">
          <span>👍 ${c.likes}</span>
          <span>💬 ${c.replies}</span>
          <span>情感值 ${(c.sentimentScore * 100).toFixed(1)}</span>
        </div>
      </div>
    </div>
  `;
  }).join('') || '<div style="text-align:center;padding:40px;color:#999;">暂无符合条件的评论</div>';
}

function detectPlatform(url) {
  if (!url) return 'bilibili';
  const lower = url.toLowerCase();
  if (lower.includes('bilibili') || lower.includes('b23.tv')) return 'bilibili';
  return 'bilibili';
}

async function handleAnalyzeProfile() {
  const username = $('profileUsername').value.trim();
  const url = $('profileUrl').value.trim();

  showLoading('正在分析用户画像，请稍候...');

  try {
    await loadChinaMap();

    // 优先检查扩展存储中的真实采集数据
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      var realProfile = await new Promise(function(resolve) {
        chrome.runtime.sendMessage({ type: 'GET_LATEST_PROFILE' }, function(resp) {
          resolve(resp);
        });
      });

      // 只要有昵称就算有数据（视频可能为0但仍有基本信息）
      if (realProfile && realProfile.data && realProfile.data.nickname) {
        var nickEl = $('collectedNickname');
        if (nickEl) {
          nickEl.textContent = '📌 ' + realProfile.data.nickname;
          nickEl.style.display = 'inline-block';
        }
        var realProfileResult = analyzeRealProfile(realProfile.data);
        renderProfileResult(realProfileResult);
        $('profileInputPanel').style.display = 'none';
        $('profileResultPanel').style.display = 'block';
        var vCount = realProfile.data.videoCount || 0;
        showToast('已加载: ' + realProfile.data.nickname + ' (' + vCount + ' 个视频)', 'info');
        hideLoading();
        return;
      }
    }

    // 没有采集数据，尝试通过链接获取
    if (url && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      showProgressForProfile('正在通过链接获取用户画像...');
      var progressTimer = setInterval(function() {
        chrome.runtime.sendMessage({ type: 'GET_COLLECT_PROGRESS' }, function(resp) {
          if (resp && resp.message) showProgressForProfile(resp.message);
        });
      }, 1000);

      var fetchResp = await new Promise(function(resolve) {
        chrome.runtime.sendMessage({ type: 'FETCH_PROFILE_BY_URL', url: url }, function(resp) {
          resolve(resp);
        });
      });
      clearInterval(progressTimer);

      if (fetchResp && fetchResp.success && fetchResp.profile) {
        var nickEl2 = $('collectedNickname');
        if (nickEl2) {
          nickEl2.textContent = '📌 ' + fetchResp.profile.nickname;
          nickEl2.style.display = 'inline-block';
        }
        var profileResult = analyzeRealProfile(fetchResp.profile);
        renderProfileResult(profileResult);
        $('profileInputPanel').style.display = 'none';
        $('profileResultPanel').style.display = 'block';
        showToast('已分析: ' + fetchResp.profile.nickname + ' (' + fetchResp.profile.videoCount + ' 个视频)', 'info');
        hideLoading();
        return;
      } else {
        showToast('通过链接获取失败: ' + (fetchResp && fetchResp.error || '未知错误'), 'error');
        hideLoading();
        return;
      }
    }

    // 独立模式（网页版）：直接调用API
    if (url) {
      showProgressForProfile('正在获取用户信息...');
      try {
        var standaloneResp = await fetchProfileByUrl(url);
        if (standaloneResp && standaloneResp.success && standaloneResp.profile) {
          var sNickEl = $('collectedNickname');
          if (sNickEl) {
            sNickEl.textContent = '📌 ' + standaloneResp.profile.nickname;
            sNickEl.style.display = 'inline-block';
          }
          var sProfileResult = analyzeRealProfile(standaloneResp.profile);
          renderProfileResult(sProfileResult);
          $('profileInputPanel').style.display = 'none';
          $('profileResultPanel').style.display = 'block';
          showToast('已分析: ' + standaloneResp.profile.nickname + ' (' + standaloneResp.profile.videoCount + ' 个视频)', 'info');
          hideLoading();
          return;
        } else {
          showToast('获取失败: ' + (standaloneResp && standaloneResp.error || '未知错误'), 'error');
          hideLoading();
          return;
        }
      } catch (e) {
        showToast('获取失败: ' + e.message, 'error');
        hideLoading();
        return;
      }
    }

    if (!username && !url) {
      showToast('请输入B站用户主页链接，或在用户主页点击扩展图标采集画像', 'error');
      hideLoading();
      return;
    }

    // 非扩展环境，使用演示数据
    const platform = detectPlatform(url || username);
    await new Promise(r => setTimeout(r, 800));
    const profile = generateUserProfile({
      username: username || undefined,
      platform: platform,
      range: 30
    });
    renderProfileResult(profile);
  } catch (e) {
    console.error('画像分析出错:', e);
    showToast('分析出错: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function handleAnalyzeVideo() {
  const url = $('videoUrl').value.trim();

  // 优先检查是否有书签/文件上传导入的数据
  if (window.__yqImportedData && window.__yqImportedData.comments && window.__yqImportedData.comments.length > 0) {
    const data = window.__yqImportedData;
    showLoading('正在分析采集的评论数据...');
    try {
      await loadChinaMap();
      const result = analyzeRealVideoData(data, data.platform || detectPlatform(url));
      renderVideoResult(result);
      showToast('已分析 ' + data.comments.length + ' 条采集评论', 'info');
    } catch (e) {
      showToast('分析出错: ' + e.message, 'error');
    } finally {
      hideLoading();
      window.__yqImportedData = null;
    }
    return;
  }

  if (!url) {
    showToast('请输入B站视频链接，或使用书签/上传文件导入评论数据', 'error');
    return;
  }

  const platform = detectPlatform(url);
  showLoading('正在分析视频评论数据...');
  await loadChinaMap();

  try {
    // 扩展模式：优先通过链接获取评论
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      var bvMatch = url.match(/BV[a-zA-Z0-9]{10}/);
      if (bvMatch) {
        showProgressForVideo('正在通过链接获取视频评论...');
        var progressTimer = setInterval(function() {
          chrome.runtime.sendMessage({ type: 'GET_COLLECT_PROGRESS' }, function(resp) {
            if (resp && resp.message) showProgressForVideo(resp.message);
          });
        }, 1000);

        var fetchResp = await new Promise(function(resolve) {
          chrome.runtime.sendMessage({ type: 'FETCH_VIDEO_COMMENTS_BY_URL', url: url }, function(resp) {
            resolve(resp);
          });
        });
        clearInterval(progressTimer);

        if (fetchResp && fetchResp.success && fetchResp.data && fetchResp.data.length > 0) {
          var result = analyzeRealVideoData(fetchResp, fetchResp.platform || platform);
          if (fetchResp.videoTitle) result.videoTitle = fetchResp.videoTitle;
          if (fetchResp.videoAuthor) result.videoAuthor = fetchResp.videoAuthor;
          if (fetchResp.videoPubdate) result.publishTime = fetchResp.videoPubdate;
          if (fetchResp.videoViews || fetchResp.videoLikes || fetchResp.videoReplies) {
            var statsParts = [];
            if (fetchResp.videoViews) statsParts.push(fetchResp.videoViews.toLocaleString() + ' 播放');
            if (fetchResp.videoLikes) statsParts.push(fetchResp.videoLikes.toLocaleString() + ' 点赞');
            if (fetchResp.videoReplies) statsParts.push(fetchResp.videoReplies.toLocaleString() + ' 评论');
            result.videoStats = statsParts.join(' · ');
          }
          renderVideoResult(result);
          showToast('已分析: ' + fetchResp.videoTitle + ' (' + fetchResp.data.length + ' 条评论)', 'info');
          hideLoading();
          return;
        } else if (fetchResp && !fetchResp.success) {
          showToast('通过链接获取失败: ' + fetchResp.error + '，尝试使用已采集数据...', 'error');
        }
      }
    }

    // 尝试从扩展存储获取真实采集数据
    let realData = null;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      realData = await new Promise(function(resolve) {
        chrome.runtime.sendMessage({ type: 'GET_LATEST_COMMENTS' }, function(resp) {
          resolve(resp);
        });
      });
    }

    if (realData && (realData.data || realData.comments) && (realData.data || realData.comments).length > 0) {
      const result = analyzeRealVideoData(realData, platform);
      renderVideoResult(result);
    } else {
      // 独立模式（网页版）：直接调用API
      var bvMatch2 = url.match(/BV[a-zA-Z0-9]{10}/);
      if (bvMatch2) {
        showProgressForVideo('正在获取视频评论...');
        try {
          var sResp = await fetchVideoCommentsByUrl(url);
          if (sResp && sResp.success && sResp.data && sResp.data.length > 0) {
            var sResult = analyzeRealVideoData(sResp, sResp.platform || platform);
            if (sResp.videoTitle) sResult.videoTitle = sResp.videoTitle;
            if (sResp.videoAuthor) sResult.videoAuthor = sResp.videoAuthor;
            if (sResp.videoPubdate) sResult.publishTime = sResp.videoPubdate;
            if (sResp.videoViews || sResp.videoLikes || sResp.videoReplies) {
              var sStatsParts = [];
              if (sResp.videoViews) sStatsParts.push(sResp.videoViews.toLocaleString() + ' 播放');
              if (sResp.videoLikes) sStatsParts.push(sResp.videoLikes.toLocaleString() + ' 点赞');
              if (sResp.videoReplies) sStatsParts.push(sResp.videoReplies.toLocaleString() + ' 评论');
              sResult.videoStats = sStatsParts.join(' · ');
            }
            renderVideoResult(sResult);
            showToast('已分析: ' + sResp.videoTitle + ' (' + sResp.data.length + ' 条评论)', 'info');
            hideLoading();
            return;
          } else {
            showToast('获取失败: ' + (sResp && sResp.error || '未知错误'), 'error');
            hideLoading();
            return;
          }
        } catch (e) {
          showToast('获取失败: ' + e.message, 'error');
          hideLoading();
          return;
        }
      }
      // 没有真实数据
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        showToast('未检测到采集数据，请输入B站视频链接自动获取，或在视频页面点击扩展图标采集评论', 'error');
        hideLoading();
        return;
      }
      // 非扩展环境，使用演示数据
      const result = generateVideoAnalysis({
        videoUrl: url,
        platform: platform,
        scope: 'all'
      });
      renderVideoResult(result);
    }
  } catch (e) {
    console.error('视频分析出错:', e);
    showToast('分析出错: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

// 分析真实采集的评论数据（兼容扩展和书签两种数据格式）
function analyzeRealVideoData(realData, platform) {
  var rawComments = realData.data || realData.comments || [];
  const pfConfig = platformConfig[realData.platform || platform] || platformConfig.bilibili;
  // 安全网：清理评论文本中的图片URL/文件名，替换avatar为平台图标
  var comments = rawComments.map(function(c) {
    var text = c.text || '';
    text = text.replace(/https?:\/\/[^\s]+/gi, '');
    text = text.replace(/[a-zA-Z0-9\/_\-]{6,}\.(jpg|jpeg|png|gif|webp|bmp)/gi, '');
    text = text.replace(/<img[^>]*>/gi, '');
    text = text.replace(/\s+/g, ' ').trim();
    return Object.assign({}, c, { text: text, avatar: pfConfig.icon });
  }).filter(function(c) { return c.text; });

  // 情感分析
  const sentimentResult = analyzeComments(comments);
  const total = comments.length;
  const sentiment = {
    positive: total > 0 ? Math.round(sentimentResult.positive / total * 100) : 0,
    neutral: total > 0 ? Math.round(sentimentResult.neutral / total * 100) : 0,
    negative: total > 0 ? Math.round(sentimentResult.negative / total * 100) : 0
  };
  const sentimentCounts = {
    positive: sentimentResult.positive,
    neutral: sentimentResult.neutral,
    negative: sentimentResult.negative
  };

  // 关键词提取
  const keywords = extractKeywords(comments, 15);
  const hotTopics = keywords.map(function(k, i) {
    return {
      topic: k.word,
      count: k.count,
      rank: i + 1
    };
  });

  // KOL识别
  const kols = identifyKOLs(comments, 10).map(function(k, i) {
    return {
      ...k,
      rank: i + 1,
      fans: k.likes * 20 + k.comments * 50
    };
  });

  // 趋势数据 - 按时间分组
  const trendData = generateTrendData(sentimentResult.details);

  // 评论样本（按点赞排序，取前50）
  const commentSamples = sentimentResult.details
    .slice()
    .sort(function(a, b) { return (b.likes || 0) - (a.likes || 0); })
    .slice(0, 50);

  return {
    videoTitle: realData.videoTitle || '未知视频',
    videoAuthor: realData.videoAuthor || '未知作者',
    videoStats: total + ' 条评论',
    videoUrl: '',
    platform: realData.platform || platform,
    publishTime: '',
    category: '',
    sentiment: sentiment,
    sentimentCounts: sentimentCounts,
    hotTopics: hotTopics,
    kols: kols,
    trendData: trendData,
    comments: commentSamples
  };
}

// 按时间生成趋势数据
function generateTrendData(comments) {
  var timeGroups = {};

  // 按日期分组
  for (var ci = 0; ci < comments.length; ci++) {
    var c = comments[ci];
    if (!c.time) continue;
    var dateKey = c.time;
    // 从 "YYYY-MM-DD" 格式中提取 "MM-DD"
    if (dateKey.length >= 10) {
      dateKey = dateKey.substring(5, 10);
    } else if (dateKey.length >= 7) {
      dateKey = dateKey.substring(5);
    }
    if (!timeGroups[dateKey]) {
      timeGroups[dateKey] = { positive: 0, neutral: 0, negative: 0, total: 0 };
    }
    var sent = c.sentiment || 'neutral';
    timeGroups[dateKey][sent]++;
    timeGroups[dateKey].total++;
  }

  var sortedKeys = Object.keys(timeGroups).sort();

  // 如果没有时间数据或只有1个日期分组，按评论序号分组（每组约10条）
  if (sortedKeys.length <= 1) {
    timeGroups = {};
    var groupSize = Math.max(1, Math.ceil(comments.length / 10));
    for (var i = 0; i < comments.length; i++) {
      var gIdx = Math.floor(i / groupSize);
      var gKey = '第' + (gIdx + 1) + '组';
      if (!timeGroups[gKey]) {
        timeGroups[gKey] = { positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      var sent2 = comments[i].sentiment || 'neutral';
      timeGroups[gKey][sent2]++;
      timeGroups[gKey].total++;
    }
    sortedKeys = Object.keys(timeGroups).sort(function(a, b) {
      return parseInt(a.replace(/[^\d]/g, '')) - parseInt(b.replace(/[^\d]/g, ''));
    });
  }

  var labels = [];
  var positive = [];
  var neutral = [];
  var negative = [];

  sortedKeys.slice(-15).forEach(function(key) {
    var g = timeGroups[key];
    labels.push(key);
    positive.push(g.total > 0 ? Math.round(g.positive / g.total * 100) : 0);
    neutral.push(g.total > 0 ? Math.round(g.neutral / g.total * 100) : 0);
    negative.push(g.total > 0 ? Math.round(g.negative / g.total * 100) : 0);
  });

  return { labels: labels, positive: positive, neutral: neutral, negative: negative };
}

// 分析真实用户画像数据
function formatDate(ts) {
  if (!ts) return '';
  var d = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function analyzeRealProfile(rawData) {
  const videos = rawData.videos || [];
  var allComments = (rawData.allComments || []).map(function(c) {
    var text = (c.text || '').replace(/https?:\/\/[^\s]+/gi, '').replace(/[a-zA-Z0-9\/_\-]{6,}\.(jpg|jpeg|png|gif|webp|bmp)/gi, '').replace(/\s+/g, ' ').trim();
    return Object.assign({}, c, { text: text });
  }).filter(function(c) { return c.text; });
  const platform = rawData.platform || 'bilibili';
  const platformNames = { bilibili: 'B站' };

  // === 关键词提取（从视频标题 + 评论文本）===
  var titleComments = videos.map(function(v) {
    return { text: (v.title || '') + ' ' + (v.description || ''), likes: v.likes || v.plays || 0 };
  });
  var commentComments = allComments.map(function(c) {
    return { text: c.text || '', likes: c.likes || 0 };
  });
  var allTextSources = titleComments.concat(commentComments);
  var keywords = extractKeywords(allTextSources, 25);

  // === 兴趣领域分类（从视频标题 + 描述）===
  var categoryKeywords = {
    '科技数码': ['手机', '电脑', 'AI', '科技', '数码', '芯片', '互联网', '软件', '硬件', '评测', '编程', '代码', '人工智能', '大模型', '机器人', '5G', 'WiFi', '笔记本', '显卡', 'CPU', '内存', 'SSD', '显示器', '机械键盘', '路由器'],
    '生活日常': ['生活', '日常', '美食', '做饭', '旅行', '旅游', '宠物', '家居', '穿搭', 'vlog', '记录', '探店', '开箱', '装修', '收纳', '早餐', '午餐', '晚餐', '猫', '狗', '植物', '园艺'],
    '娱乐搞笑': ['搞笑', '娱乐', '综艺', '明星', '追剧', '电影', '音乐', '舞蹈', '演唱会', '翻唱', '鬼畜', '段子', '脱口秀', '相声', '动画', '番剧', '国创', '声优'],
    '知识教育': ['知识', '教育', '学习', '历史', '科普', '教程', '课程', '读书', '讲解', '解析', '揭秘', '考研', '英语', '数学', '物理', '化学', '生物', '哲学', '心理学', '社会学'],
    '游戏电竞': ['游戏', '电竞', '攻略', '直播', '王者', '吃鸡', '原神', 'LOL', 'Minecraft', 'Steam', '主机', 'PS5', 'Switch', 'Xbox', 'FPS', 'MOBA', 'RPG', '通关', '实况', '速通'],
    '体育健身': ['运动', '健身', '篮球', '足球', '跑步', '瑜伽', '体育', '减肥', '增肌', 'NBA', 'CBA', '世界杯', '奥运会', '羽毛球', '乒乓球', '游泳', '骑行'],
    '财经商业': ['财经', '投资', '股票', '理财', '商业', '创业', '经济', '基金', '币圈', 'A股', '美股', '比特币', '区块链', '消费', '通胀', '利率', '房价', '就业']
  };

  var categoryCounts = {};
  videos.forEach(function(v) {
    var text = ((v.title || '') + ' ' + (v.description || '')).toLowerCase();
    var matched = false;
    Object.keys(categoryKeywords).forEach(function(cat) {
      categoryKeywords[cat].forEach(function(kw) {
        if (text.indexOf(kw.toLowerCase()) >= 0) {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          matched = true;
        }
      });
    });
    if (!matched) {
      // 如果没匹配到任何类别，不要全部分到"其他"，而是尝试从关键词推断
      var videoKeywords = extractKeywords([{ text: v.title || '', likes: 0 }], 5);
      var foundCat = false;
      videoKeywords.forEach(function(kw) {
        Object.keys(categoryKeywords).forEach(function(cat) {
          if (foundCat) return;
          categoryKeywords[cat].forEach(function(ckw) {
            if (foundCat) return;
            if (kw.word.indexOf(ckw) >= 0 || ckw.indexOf(kw.word) >= 0) {
              categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
              foundCat = true;
            }
          });
        });
      });
      if (!foundCat) categoryCounts['其他'] = (categoryCounts['其他'] || 0) + 1;
    }
  });

  var totalCats = Object.values(categoryCounts).reduce(function(a, b) { return a + b; }, 0) || 1;
  var interestDistribution = Object.keys(categoryCounts).map(function(cat) {
    return { name: cat, value: Math.round(categoryCounts[cat] / totalCats * 100) };
  }).sort(function(a, b) { return b.value - a.value; });

  // === 等级评定 ===
  var followers = rawData.followers || 0;
  var level, levelColor;
  if (followers >= 1000000) { level = '顶级创作者'; levelColor = '#ff4757'; }
  else if (followers >= 100000) { level = '知名创作者'; levelColor = '#ff6b81'; }
  else if (followers >= 10000) { level = '活跃创作者'; levelColor = '#3742fa'; }
  else if (followers >= 1000) { level = '成长创作者'; levelColor = '#2ed573'; }
  else { level = '新晋创作者'; levelColor = '#ffa502'; }

  // === 活跃趋势 — 按发帖日期分组 ===
  var dateGroups = {};
  videos.forEach(function(v) {
    var date = v.date || '';
    if (!date && v.timestamp) date = formatDate(v.timestamp);
    if (!date) return;
    var month = date.substring(0, 7); // "YYYY-MM"
    if (!month || month.length < 7) return;
    if (!dateGroups[month]) dateGroups[month] = 0;
    dateGroups[month]++;
  });

  var sortedMonths = Object.keys(dateGroups).sort();
  var trendLabels = sortedMonths.slice(-15);
  var trendData = trendLabels.map(function(m) { return dateGroups[m]; });

  // 如果没有日期数据，用视频序号
  if (trendLabels.length === 0) {
    trendLabels = videos.map(function(v, i) { return '#' + (i + 1); });
    trendData = videos.map(function() { return 1; });
  }

  // === 情感分析（从视频标题 + 评论文本）===
  var sentPos = 0, sentNeu = 0, sentNeg = 0;
  var sentTexts = videos.map(function(v) { return v.title || ''; })
    .concat(allComments.map(function(c) { return c.text || ''; }));

  sentTexts.forEach(function(text) {
    if (!text || text.length < 2) return;
    var result = analyzeSentiment(text);
    if (result.sentiment === 'positive') sentPos++;
    else if (result.sentiment === 'negative') sentNeg++;
    else sentNeu++;
  });

  var sentTotal = sentPos + sentNeu + sentNeg || 1;
  var sentiment = {
    positive: Math.round(sentPos / sentTotal * 100),
    neutral: Math.round(sentNeu / sentTotal * 100),
    negative: Math.round(sentNeg / sentTotal * 100)
  };

  // === 标签 ===
  var tags = keywords.slice(0, 6).map(function(k) { return k.word; });
  if (tags.length === 0) tags = ['内容创作者'];
  if (sentiment.positive > 50) tags.push('正能量');
  if (sentiment.negative > 30) tags.push('批判性');
  if (followers > 10000) tags.push('人气创作者');

  // === 词云数据 ===
  var postWordCloudData = keywords.map(function(k) {
    return { name: k.word, value: k.count };
  });

  // === 话题 ===
  var participatedTopics = keywords.slice(0, 12).map(function(k) {
    return { name: k.word, count: k.count, category: '内容' };
  });

  // === 点赞排行（真实用户） — 使用采集的评论用户数据 ===
  var likeRanking = rawData.likeRanking || [];
  if (likeRanking.length === 0 && allComments.length > 0) {
    var userLikes = {};
    allComments.forEach(function(c) {
      var key = c.mid || c.user;
      if (!userLikes[key]) userLikes[key] = { user: c.user, likes: 0, count: 0 };
      userLikes[key].likes += (c.likes || 0);
      userLikes[key].count++;
    });
    likeRanking = Object.values(userLikes)
      .sort(function(a, b) { return b.likes - a.likes; })
      .slice(0, 10)
      .map(function(u, i) { return { rank: i + 1, user: u.user, likes: u.likes }; });
  }

  // === 评论排行（真实用户） — 使用采集的评论用户数据 ===
  var commentRanking = rawData.commentRanking || [];
  if (commentRanking.length === 0 && allComments.length > 0) {
    var userComments = {};
    allComments.forEach(function(c) {
      var key = c.mid || c.user;
      if (!userComments[key]) userComments[key] = { user: c.user, comments: 0, replies: 0 };
      userComments[key].comments++;
      userComments[key].replies += (c.replies || 0);
    });
    commentRanking = Object.values(userComments)
      .sort(function(a, b) { return b.comments - a.comments; })
      .slice(0, 10)
      .map(function(u, i) { return { rank: i + 1, user: u.user, comments: u.comments, replies: u.replies }; });
  }

  // === 估算互动数据 ===
  var totalVideoLikes = rawData.totalVideoLikes || rawData.accountLikes || 0;
  var estComments = allComments.length > 0 ? allComments.length : Math.round(totalVideoLikes * 0.02);
  var estForwards = Math.round(totalVideoLikes * 0.05);

  // === 画像摘要 ===
  var platName = platformNames[platform] || platform;
  var avgLikes = rawData.avgVideoLikes || 0;
  var avgPlays = rawData.avgVideoPlays || 0;
  var interactionRate = followers > 0 ? (totalVideoLikes / followers * 100).toFixed(1) : '0';
  var topCategory = interestDistribution.length > 0 ? interestDistribution[0] : null;
  var sentimentDesc = sentiment.positive > sentiment.negative ? '正面' : (sentiment.negative > sentiment.positive ? '负面' : '中性');
  var totalPlays = rawData.totalPlays || rawData.totalVideoPlays || 0;

  var summary = '【' + (rawData.nickname || '未知用户') + '】是' + platName + '平台的' + level + '。\n\n' +
    '📊 数据概览：\n' +
    '• 粉丝 ' + followers.toLocaleString() + '，关注 ' + (rawData.following || 0).toLocaleString() + '\n' +
    '• 发布视频 ' + videos.length + ' 个，总播放 ' + totalPlays.toLocaleString() + '\n' +
    '• 总获赞 ' + totalVideoLikes.toLocaleString() + '，平均每视频 ' + avgLikes.toLocaleString() + ' 赞\n' +
    '• 互动率 ' + interactionRate + '%\n\n' +
    '🎯 内容分析：\n' +
    (topCategory ? '• 主要内容方向：' + topCategory.name + '（占比 ' + topCategory.value + '%）\n' : '') +
    '• 高频关键词：' + keywords.slice(0, 5).map(function(k) { return k.word + '(' + k.count + ')'; }).join('、') + '\n' +
    '• 情感倾向：正面 ' + sentiment.positive + '%，中性 ' + sentiment.neutral + '%，负面 ' + sentiment.negative + '%\n' +
    (allComments.length > 0 ? '• 采集评论 ' + allComments.length + ' 条，活跃评论者 ' + commentRanking.length + ' 人\n' : '') +
    '\n💡 分析结论：该创作者在' + (topCategory ? topCategory.name : '内容') + '领域活跃度较高，' +
    '内容情感偏' + sentimentDesc + '。' +
    (interactionRate > 10 ? '互动率较高，粉丝粘性强。' : interactionRate > 3 ? '互动率适中。' : '互动率偏低，可优化内容策略。');

  return {
    username: rawData.nickname || '未知用户',
    platform: platform,
    range: 'all',
    tags: tags,
    level: level,
    levelColor: levelColor,
    posts: videos.length,
    comments: estComments,
    forwards: estForwards,
    likes: totalVideoLikes,
    fans: followers,
    trendData: trendData,
    trendLabels: trendLabels,
    interestDistribution: interestDistribution,
    sentiment: sentiment,
    postWordCloudData: postWordCloudData,
    participatedTopics: participatedTopics,
    relNodes: [],
    relLinks: [],
    likeRanking: likeRanking,
    commentRanking: commentRanking,
    videoLocations: [],
    summary: summary
  };
}

function loadDemoProfile() {
  $('profileUsername').value = '科技前沿小李';
  $('profileUrl').value = 'https://space.bilibili.com/demo';
  handleAnalyzeProfile();
}

function loadDemoVideo() {
  $('videoUrl').value = 'https://www.bilibili.com/video/BV1xx 科技前沿-AI大模型最新进展';
  handleAnalyzeVideo();
}

function clearVideoResult() {
  $('videoResultPanel').style.display = 'none';
  $('videoUrl').value = '';
  window.__yqImportedData = null;
  showToast('已清空', 'info');
}

// ===== 书签/文件导入数据处理 =====

function processImportedData(data) {
  if (!data || !data.comments || data.comments.length === 0) {
    showToast('导入的数据中没有评论', 'error');
    return;
  }
  window.__yqImportedData = data;
  switchTab('video');
  if (data.videoTitle) {
    $('videoUrl').value = data.videoTitle;
  }
  handleAnalyzeVideo();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.comments && data.comments.length > 0) {
        processImportedData(data);
      } else if (data.data && data.data.length > 0) {
        data.comments = data.data;
        processImportedData(data);
      } else {
        showToast('文件中没有有效的评论数据', 'error');
      }
    } catch (err) {
      showToast('文件解析失败: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function checkWindowName() {
  try {
    var name = window.name || '';
    if (name.indexOf('YUQING:') === 0) {
      var json = name.substring(7);
      var data = JSON.parse(json);
      window.name = '';
      setTimeout(function() {
        processImportedData(data);
      }, 500);
      return true;
    }
  } catch (e) {
    console.error('解析 window.name 失败:', e);
    window.name = '';
  }
  return false;
}

function checkUrlHash() {
  var hash = window.location.hash || '';
  if (hash.indexOf('#import=base64&') === 0) {
    try {
      var encoded = hash.substring(16);
      var json = decodeURIComponent(escape(atob(encoded)));
      var data = JSON.parse(json);
      history.replaceState(null, '', window.location.pathname);
      setTimeout(function() {
        processImportedData(data);
      }, 500);
      return true;
    } catch (e) {
      console.error('解析 URL hash 失败:', e);
    }
  } else if (hash === '#import=windowname') {
    history.replaceState(null, '', window.location.pathname);
    return checkWindowName();
  } else if (hash === '#import=file') {
    history.replaceState(null, '', window.location.pathname);
    showToast('请点击"上传评论文件"按钮，选择刚才下载的JSON文件', 'info');
    switchTab('video');
    return true;
  }
  return false;
}

function setupPostMessageListener() {
  window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'BOOKMARKLET_DATA' && event.data.comments) {
      processImportedData(event.data);
      try {
        event.source.postMessage({ type: 'DATA_RECEIVED' }, '*');
      } catch (e) {}
    }
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('/sw.js').catch(function(e) {
      console.warn('Service Worker 注册失败:', e);
    });
  }
}

async function init() {
  registerServiceWorker();
  setupPostMessageListener();

  await loadChinaMap();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $('analyzeProfile').addEventListener('click', handleAnalyzeProfile);
  $('analyzeVideo').addEventListener('click', handleAnalyzeVideo);
  $('loadDemoProfile').addEventListener('click', loadDemoProfile);
  $('loadDemoVideo').addEventListener('click', loadDemoVideo);
  $('clearVideo').addEventListener('click', clearVideoResult);
  $('clearProfile').addEventListener('click', function() {
    $('profileUsername').value = '';
    $('profileUrl').value = '';
    $('profileResultPanel').style.display = 'none';
    $('profileInputPanel').style.display = 'block';
    var nickEl = $('collectedNickname');
    if (nickEl) nickEl.style.display = 'none';
    // 清空扩展存储中的画像数据
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(null, function(all) {
        var keys = Object.keys(all).filter(function(k) { return k.startsWith('profile_'); });
        if (keys.length > 0) {
          chrome.storage.local.remove(keys, function() {
            showToast('已清空所有画像数据', 'info');
          });
        } else {
          showToast('已清空', 'info');
        }
      });
    } else {
      showToast('已清空', 'info');
    }
  });

  var uploadBtn = $('uploadCommentsBtn');
  var fileInput = $('commentsFileInput');
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', handleFileUpload);
  }

  // 检查书签导入的数据（window.name 或 URL hash）
  var imported = checkUrlHash();
  if (!imported) {
    imported = checkWindowName();
  }

  // 扩展模式：监听来自 content script 的数据导入
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.type === 'IMPORT_COMMENTS') {
        switchTab('video');
        if (request.videoTitle) {
          $('videoUrl').value = request.videoTitle;
        }
        handleAnalyzeVideo();
        sendResponse({ success: true });
      }
      if (request.type === 'IMPORT_PROFILE') {
        switchTab('profile');
        handleAnalyzeProfile();
        sendResponse({ success: true });
      }
      return true;
    });

    if (!imported) {
      chrome.runtime.sendMessage({ type: 'GET_LATEST_COMMENTS' }, function(resp) {
        if (resp && resp.data && resp.data.length > 0) {
          $('videoUrl').value = resp.videoTitle || '';
          showToast('检测到 ' + resp.data.length + ' 条已采集评论，点击"开始分析"查看结果', 'info');
        }
      });
      chrome.runtime.sendMessage({ type: 'GET_LATEST_PROFILE' }, function(resp) {
        if (resp && resp.data && resp.data.nickname) {
          showToast('检测到用户画像: ' + resp.data.nickname + ' (' + resp.data.videoCount + '视频)，点击"用户画像分析"查看', 'info');
          var nickEl = $('collectedNickname');
          if (nickEl) {
            nickEl.textContent = '📌 ' + resp.data.nickname;
            nickEl.style.display = 'inline-block';
          }
          if ($('profileUsername')) {
            $('profileUsername').value = resp.data.nickname;
          }
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
