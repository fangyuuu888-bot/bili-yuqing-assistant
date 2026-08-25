(function() {
  var btn = document.getElementById('downloadBtn');
  var hint = document.getElementById('downloadHint');
  if (!btn) return;

  var DOWNLOAD_URL = 'https://github.com/fangyuuu888-bot/bili-yuqing-assistant/releases/download/latest/bili-yuqing-assistant.zip';

  btn.addEventListener('click', function() {
    hint.textContent = '正在下载...';

    // 尝试 fetch + blob 下载（支持显示下载进度）
    fetch(DOWNLOAD_URL)
      .then(function(response) {
        if (!response.ok) throw new Error('fetch failed: ' + response.status);
        return response.blob();
      })
      .then(function(blob) {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bili-yuqing-assistant.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        hint.textContent = '\u2705 \u4e0b\u8f7d\u5b8c\u6210\uff0c\u8bf7\u89e3\u538b\u540e\u5b89\u88c5';
      })
      .catch(function() {
        // 回退：直接打开下载链接
        window.open(DOWNLOAD_URL, '_blank');
        hint.textContent = '\u2705 \u5df2\u6253\u5f00\u4e0b\u8f7d\u9875\u9762\uff0c\u8bf7\u4fdd\u5b58\u6587\u4ef6';
      });
  });
})();
