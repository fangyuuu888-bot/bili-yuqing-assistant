(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(location.origin + '/sw.js').catch(function() {});
  }

  var btn = document.getElementById('downloadBtn');
  var hint = document.getElementById('downloadHint');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var zipName = 'bili-yuqing-assistant.zip';
    var url = location.href.replace(/install\.html.*$/, '') + zipName;
    if (location.protocol === 'file:') {
      url = location.href.replace(/install\.html.*$/, '') + zipName;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    hint.textContent = '正在下载...';

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        var blob = xhr.response;
        var a = document.createElement('a');
        var blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = 'bili-yuqing-assistant.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 1000);
        hint.textContent = '✅ 下载完成，请解压后安装';
      } else {
        hint.textContent = '❌ 下载失败，请手动获取安装包';
      }
    };

    xhr.onerror = function() {
      hint.textContent = '❌ 下载失败，请手动获取安装包';
    };

    xhr.send();
  });
})();
