document.addEventListener('DOMContentLoaded', function() {
  var platformDot = document.getElementById('platformDot');
  var platformName = document.getElementById('platformName');
  var dataCount = document.getElementById('dataCount');
  var captureBtn = document.getElementById('captureBtn');
  var profileBtn = document.getElementById('profileBtn');
  var dashboardBtn = document.getElementById('dashboardBtn');
  var linkBtn = document.getElementById('linkBtn');
  var linkInput = document.getElementById('linkInput');

  function isUserProfilePage(url) {
    return url.indexOf('space.bilibili.com') >= 0 || url.indexOf('/space/') >= 0;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) return;
    var url = tabs[0].url || '';
    var isVideoPage = url.indexOf('/video/') >= 0 || url.indexOf('b23.tv') >= 0;
    var isProfilePage = isUserProfilePage(url);

    if (url.indexOf('bilibili.com') >= 0 || url.indexOf('b23.tv') >= 0) {
      platformDot.classList.add('active');
      if (isProfilePage) {
        platformName.textContent = 'B站用户主页';
        profileBtn.style.display = 'flex';
      } else if (isVideoPage) {
        platformName.textContent = 'B站视频页面';
      } else {
        platformName.textContent = 'B站（非视频页）';
        platformName.style.color = '#e74c3c';
        captureBtn.disabled = true;
        captureBtn.style.opacity = '0.5';
        captureBtn.textContent = '请在视频页面使用';
      }
    } else {
      platformName.textContent = '请在B站页面使用';
      platformName.style.color = '#999';
      captureBtn.disabled = true;
      captureBtn.style.opacity = '0.5';
    }
  });

  chrome.runtime.sendMessage({ type: 'GET_LATEST_COMMENTS' }, function(resp) {
    if (resp && resp.data && resp.data.length > 0) {
      dataCount.classList.remove('empty');
      dataCount.textContent = '已有 ' + resp.data.length + ' 条评论 (' + (resp.videoTitle || '').substring(0, 20) + '...)';
    }
  });

  captureBtn.addEventListener('click', function() {
    captureBtn.textContent = '采集中...';
    captureBtn.disabled = true;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'CAPTURE_COMMENTS' }, function(response) {
        if (chrome.runtime.lastError) {
          captureBtn.textContent = '❌ 采集失败，请刷新页面';
          setTimeout(function() { captureBtn.textContent = '📥 采集当前页面评论'; captureBtn.disabled = false; }, 2000);
          return;
        }
        if (response && response.success) {
          captureBtn.textContent = '✅ 采集成功 ' + response.count + ' 条';
          dataCount.classList.remove('empty');
          dataCount.textContent = '已采集 ' + response.count + ' 条评论数据';
          chrome.runtime.sendMessage({
            type: 'SAVE_COMMENTS', videoId: response.videoId,
            videoTitle: response.videoTitle, videoAuthor: response.videoAuthor,
            platform: 'bilibili', data: response.comments
          }, function() {
            setTimeout(function() { captureBtn.textContent = '📥 采集当前页面评论'; captureBtn.disabled = false; }, 1500);
          });
        } else {
          captureBtn.textContent = '❌ ' + ((response && response.error) || '采集失败');
          setTimeout(function() { captureBtn.textContent = '📥 采集当前页面评论'; captureBtn.disabled = false; }, 4000);
        }
      });
    });
  });

  profileBtn.addEventListener('click', function() {
    profileBtn.textContent = '采集中...';
    profileBtn.disabled = true;

    // 显示采集进度
    var progressInterval = setInterval(function() {
      chrome.runtime.sendMessage({ type: 'GET_COLLECT_PROGRESS' }, function(resp) {
        if (resp && resp.message) {
          profileBtn.textContent = resp.message;
        }
      });
    }, 500);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'COLLECT_PROFILE' }, function(response) {
        if (chrome.runtime.lastError) {
          clearInterval(progressInterval);
          profileBtn.textContent = '❌ 采集失败，请刷新页面';
          setTimeout(function() { profileBtn.textContent = '👤 采集用户画像'; profileBtn.disabled = false; }, 2000);
          return;
        }
        if (response && response.success) {
          clearInterval(progressInterval);
          var p = response.profile;
          profileBtn.textContent = '✅ ' + p.nickname + ' (' + p.videoCount + '视频)';
          chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', username: p.nickname, platform: 'bilibili', data: p }, function() {
            setTimeout(function() { profileBtn.textContent = '👤 采集用户画像'; profileBtn.disabled = false; }, 2000);
          });
        } else {
          clearInterval(progressInterval);
          profileBtn.textContent = '❌ ' + ((response && response.error) || '采集失败');
          setTimeout(function() { profileBtn.textContent = '👤 采集用户画像'; profileBtn.disabled = false; }, 3000);
        }
      });
    });
  });

  dashboardBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });

  function extractUrl(text) {
    var match = text.match(/https?:\/\/[^\s\uff0c\u3002\uff01\uff1f]+/);
    if (match) return match[0].replace(/[.,!?\uff0c\u3002\uff01\uff1f]$/, '');
    match = text.match(/b23\.tv\/[\w]+/);
    if (match) return 'https://' + match[0];
    match = text.match(/www\.bilibili\.com\/video\/[\w]+/);
    if (match) return 'https://' + match[0];
    match = text.match(/bilibili\.com\/video\/[\w]+/);
    if (match) return 'https://' + match[0];
    return null;
  }

  linkBtn.addEventListener('click', function() {
    var text = linkInput.value.trim();
    if (!text) { linkInput.focus(); return; }
    var url = extractUrl(text);
    if (!url) {
      linkBtn.textContent = '❌ 未找到B站链接';
      setTimeout(function() { linkBtn.innerHTML = '<span>🔗</span> 解析链接并采集'; }, 2000);
      return;
    }
    linkBtn.textContent = '⏳ 正在打开页面...';
    linkBtn.disabled = true;

    chrome.tabs.create({ url: url, active: true }, function(tab) {
      var tabId = tab.id;
      var settled = false;
      var timeout = setTimeout(function() {
        if (settled) return; settled = true;
        chrome.tabs.onUpdated.removeListener(listener);
        linkBtn.textContent = '❌ 页面加载超时';
        linkBtn.disabled = false;
        setTimeout(function() { linkBtn.innerHTML = '<span>🔗</span> 解析链接并采集'; }, 3000);
      }, 30000);

      function listener(updatedTabId, changeInfo) {
        if (updatedTabId !== tabId || settled) return;
        if (changeInfo.status === 'complete') {
          settled = true; clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          linkBtn.textContent = '⏳ 正在采集评论...';
          setTimeout(function() {
            chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_COMMENTS' }, function(response) {
              linkBtn.disabled = false;
              if (chrome.runtime.lastError) {
                linkBtn.textContent = '❌ 采集失败，请手动采集';
                setTimeout(function() { linkBtn.innerHTML = '<span>🔗</span> 解析链接并采集'; }, 3000);
                return;
              }
              if (response && response.success) {
                linkBtn.textContent = '✅ 采集 ' + response.count + ' 条评论';
                dataCount.classList.remove('empty');
                dataCount.textContent = response.count + ' 条评论 (' + (response.videoTitle || '').substring(0, 20) + '...)';
                chrome.runtime.sendMessage({
                  type: 'SAVE_COMMENTS', videoId: response.videoId,
                  videoTitle: response.videoTitle, videoAuthor: response.videoAuthor,
                  platform: 'bilibili', data: response.comments
                });
                setTimeout(function() { linkBtn.innerHTML = '<span>🔗</span> 解析链接并采集'; }, 5000);
              } else {
                linkBtn.textContent = '❌ ' + ((response && response.error) || '采集失败').substring(0, 30);
                setTimeout(function() { linkBtn.innerHTML = '<span>🔗</span> 解析链接并采集'; }, 5000);
              }
            });
          }, 3000);
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });
  });
});
