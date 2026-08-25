(function() {
  var btn = document.getElementById('downloadBtn');
  var hint = document.getElementById('downloadHint');
  if (!btn) return;

  btn.addEventListener('click', function() {
    hint.textContent = '正在下载...';

    var a = document.createElement('a');
    a.href = 'bili-yuqing-assistant.zip';
    a.download = 'bili-yuqing-assistant.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    hint.textContent = '✅ 下载已开始，请解压后安装';
  });
})();
