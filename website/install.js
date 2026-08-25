(function() {
  var btn = document.getElementById('downloadBtn');
  var hint = document.getElementById('downloadHint');
  if (!btn) return;

  btn.addEventListener('click', function() {
    hint.textContent = '正在下载...';

    fetch('bili-yuqing-assistant.zip')
      .then(function(response) {
        if (!response.ok) throw new Error('fetch failed');
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
        window.open('bili-yuqing-assistant.zip', '_blank');
        hint.textContent = '\u2705 \u5df2\u6253\u5f00\u4e0b\u8f7d\u94fe\u63a5\uff0c\u5982\u672a\u81ea\u52a8\u4e0b\u8f7d\u8bf7\u53f3\u952e\u53e6\u5b58\u4e3a';
      });
  });
})();
