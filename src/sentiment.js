// 中文情感分析模块 - 基于情感词典 + 规则匹配
// 不依赖外部API，完全本地运行

// 正面情感词典
const positiveWords = [
  '好', '棒', '赞', '优秀', '厉害', '牛', '强', '不错', '喜欢', '爱',
  '支持', '点赞', '收藏', '转发', '关注', '期待', '惊喜', '感动', '开心',
  '快乐', '幸福', '美好', '温暖', '治愈', '正能量', '励志', '努力', '加油',
  '成长', '进步', '提升', '学到', '知识', '干货', '宝藏', '安利', '推荐',
  '必看', '经典', '完美', '精彩', '震撼', '惊艳', '绝了', '太好了', '终于',
  '感谢', '谢谢', '感恩', '感谢分享', '受益', '受教', '长知识', '涨知识',
  '有意思', '有趣', '可爱', '帅气', '漂亮', '美丽', '好看', '好听',
  '好评', '五星', '满分', '666', '牛批', '神仙', '天花板', 'yyds',
  '绝绝子', '太绝了', '爱了', '心动', '种草', '真香', '良心', '业界',
  '专业', '靠谱', '放心', '满意', '舒适', '方便', '实用', '好用',
  '性价比', '便宜', '划算', '超值', '物超所值', '免费', '福利',
  '哈哈', '笑死', '笑死我了', '太逗了', '可爱到', '萌', '乖',
  '哇', '天哪', '我的天', '不是吧', '真的吗', '太强了', '太猛了',
  '顶', 'up', '催更', '求更新', '想看', '期待更多', '一直在看',
  '忠实', '老粉', '铁粉', '关注很久', '一直关注', '良心博主',
  '讲得', '说得好', '说到点', '切中要害', '一针见血', '透彻',
  '清晰', '明白', '秒懂', '恍然大悟', '豁然开朗', '启发', '思考',
  '格局', '大气', '胸怀', '担当', '责任', '希望', '未来', '前景',
  '创新', '突破', '领先', '前沿', '高端', '品质', '质量'
];

// 负面情感词典
const negativeWords = [
  '差', '烂', '垃圾', '废话', '无聊', '没意思', '没劲', '差评',
  '失望', '恶心', '反感', '讨厌', '烦', '烦人', '刺耳', '难受',
  '难看', '难听', '丑', '土', 'low', '低端', '廉价', '山寨',
  '骗', '骗子', '忽悠', '套路', '坑', '坑人', '坑钱', '割韭菜',
  '广告', '恰饭', '带货', '推销', '营销号', '标题党', '蹭热度',
  '无聊', '水', '水文', '水视频', '没营养', '浪费时间', '耽误',
  '烂片', '翻车', '塌房', '人设', '假', '做作', '装', '装模作样',
  '虚伪', '势利', '功利', '市侩', '铜臭', '俗', '俗气',
  '失败', '失败品', '残次', '劣质', '破', '垃圾袋', '不能用',
  '贵', '太贵', '不值', '智商税', '冤大头', '被坑', '上当',
  '退钱', '退款', '投诉', '差评', '黑名单', '拉黑', '取关',
  '不看了', '不看', '再见', '拜拜', '糊了', '过气', '凉了',
  '尴尬', '社死', '丢人', '丢脸', '丢份', '出洋相',
  '气', '气死', '气人', '愤怒', '怒', '可恶', '该死',
  '糟糕', '悲剧', '惨', '凄惨', '可怜', '可悲', '可叹',
  '担心', '忧虑', '焦虑', '不安', '恐惧', '害怕', '怕',
  '哭', '泪', '伤心', '难过', '心痛', '心碎', '崩溃',
  '别', '不要', '不行', '不好', '不能', '不可以', '别这样',
  '真的吗', '不是吧', '假的', '质疑', '怀疑', '不信',
  '什么鬼', '什么东西', '搞什么', '莫名其妙', '神经病',
  '太差', '太烂', '看不下去', '弃剧', '弃了', '追不动',
  '粉丝', '脑残粉', '水军', '控评', '刷', '刷屏', '带节奏',
  '黑', '黑子', '黑料', '爆', '爆料', '瓜', '吃瓜'
];

// 中性/程度副词
const degreeWords = {
  '太': 1.5, '非常': 1.5, '超级': 1.8, '极其': 2, '特别': 1.5,
  '十分': 1.5, '格外': 1.5, '分外': 1.5, '尤为': 1.5, '尤其': 1.3,
  '更': 1.3, '越': 1.2, '最': 2, '顶': 1.5, '透': 1.5,
  '有点': 0.5, '稍微': 0.5, '略微': 0.5, '一些': 0.8, '一点': 0.8,
  '还': 0.8, '算': 0.8, '蛮': 1.2, '挺': 1.2, '颇': 1.3,
  '真': 1.5, '真的': 1.5, '确实': 1.3, '果然': 1.3, '居然': 1.2,
  '竟然': 1.2, '简直': 1.8, '根本': 1.5, '完全': 1.5, '彻底': 1.8,
  '好': 1.3, '好不': 1.5, '好生': 1.3
};

// 否定词
const negationWords = ['不', '没', '无', '非', '别', '勿', '未', '莫', '没有', '不是', '不要', '不能', '不行', '无法', '无法'];

// 表情符号情感
const positiveEmojis = ['😀', '😁', '😂', '😄', '😆', '😍', '🥰', '😘', '😎', '🤩', '🥳', '👍', '💪', '❤️', '💕', '💖', '🔥', '✨', '👏', '🙌', '🎉', '💯', '🌹', '🌸', '⭐'];
const negativeEmojis = ['😡', '😤', '😠', '🤬', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😭', '😢', '🤮', '🤢', '👎', '💔', '💀', '🤡'];

// 分析单条评论的情感
export function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', score: 0.5, positive: 0, negative: 0 };
  }

  let positiveScore = 0;
  let negativeScore = 0;
  let hasNegation = false;

  // 检查表情符号
  for (const emoji of positiveEmojis) {
    if (text.indexOf(emoji) !== -1) positiveScore += 1;
  }
  for (const emoji of negativeEmojis) {
    if (text.indexOf(emoji) !== -1) negativeScore += 1;
  }

  // 扫描正面词
  for (const word of positiveWords) {
    let idx = text.indexOf(word);
    while (idx !== -1) {
      let weight = 1;
      // 检查前面3个字符是否有程度副词
      const prefix = text.substring(Math.max(0, idx - 3), idx);
      for (const dw in degreeWords) {
        if (prefix.indexOf(dw) !== -1) {
          weight = degreeWords[dw];
          break;
        }
      }
      // 检查前面2个字符是否有否定词
      const negPrefix = text.substring(Math.max(0, idx - 2), idx);
      for (const nw of negationWords) {
        if (negPrefix.indexOf(nw) !== -1) {
          weight = -weight;
          break;
        }
      }
      if (weight > 0) {
        positiveScore += weight;
      } else {
        negativeScore += Math.abs(weight);
      }
      idx = text.indexOf(word, idx + word.length);
    }
  }

  // 扫描负面词
  for (const word of negativeWords) {
    let idx = text.indexOf(word);
    while (idx !== -1) {
      let weight = 1;
      const prefix = text.substring(Math.max(0, idx - 3), idx);
      for (const dw in degreeWords) {
        if (prefix.indexOf(dw) !== -1) {
          weight = degreeWords[dw];
          break;
        }
      }
      // 否定负面词 = 正面 (如"不差")
      const negPrefix = text.substring(Math.max(0, idx - 2), idx);
      for (const nw of negationWords) {
        if (negPrefix.indexOf(nw) !== -1) {
          weight = -weight;
          break;
        }
      }
      if (weight > 0) {
        negativeScore += weight;
      } else {
        positiveScore += Math.abs(weight);
      }
      idx = text.indexOf(word, idx + word.length);
    }
  }

  // 判断情感
  let sentiment, score;
  const total = positiveScore + negativeScore;

  if (total === 0) {
    sentiment = 'neutral';
    score = 0.5;
  } else if (positiveScore > negativeScore * 1.2) {
    sentiment = 'positive';
    score = positiveScore / (positiveScore + negativeScore);
  } else if (negativeScore > positiveScore * 1.2) {
    sentiment = 'negative';
    score = negativeScore / (positiveScore + negativeScore);
  } else {
    sentiment = 'neutral';
    score = 0.5;
  }

  return {
    sentiment: sentiment,
    score: Math.min(1, Math.max(0, score)),
    positive: positiveScore,
    negative: negativeScore
  };
}

// 批量分析评论
export function analyzeComments(comments) {
  const results = {
    positive: 0,
    neutral: 0,
    negative: 0,
    details: []
  };

  for (const c of comments) {
    const analysis = analyzeSentiment(c.text);
    results[analysis.sentiment]++;
    results.details.push({
      ...c,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.score
    });
  }

  return results;
}

// 提取关键词/话题
export function extractKeywords(comments, topN) {
  topN = topN || 10;
  const wordFreq = {};
  const stopWords = new Set([
    '的', '了', '是', '在', '我', '也', '都', '就', '你', '他', '她',
    '这', '那', '有', '没', '不', '说', '看', '到', '和', '与', '但',
    '又', '还', '能', '会', '对', '让', '把', '给', '向', '从', '为',
    '以', '于', '及', '或', '而', '则', '其', '之', '者', '乎', '所',
    '一个', '什么', '怎么', '为什么', '这个', '那个', '这些', '那些',
    '可以', '这样', '那样', '这么', '那么', '只是', '只有', '只要', '因为', '所以',
    '如果', '虽然', '但是', '然而', '还是', '或者', '已经', '曾经',
    '真的', '一下', '一些', '一点', '一直', '一定', '一样',
    '啊', '哦', '嗯', '哈', '吧', '呢', '嘛', '呀', '哇', '哎', '唉',
    '他们', '她们', '我们', '你们', '自己', '别人', '大家', '人', '事', '东西',
    '时候', '地方', '感觉', '觉得', '认为', '知道', '发现',
    '其实', '当然', '可能', '应该', '也许', '大概', '估计', '差不多',
    '现在', '以前', '以后', '之前', '之后', '当时', '然后', '接着', '后来',
    '里面', '外面', '上面', '下面', '前面', '后面', '旁边', '中间',
    '起来', '下来', '过来', '过去', '下去', '出去', '回来',
    '这里', '那里', '它们',
    '这个视频', '这个', '那个', '就是', '还有', '不是', '不会', '不能',
    '真的', '太难', '一下', '这种', '那种', '这种', '那种'
  ]);

  // CJK 字符检测
  function isCJK(ch) {
    var code = ch.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
  }

  // 有意义的英文缩写/单词白名单
  var englishWhitelist = new Set([
    'AI', 'CPU', 'GPU', '5G', 'WiFi', 'LOL', 'NBA', 'CBA', 'PS5', 'PS4',
    'SSD', 'VR', 'AR', '4K', '8K', 'SDK', 'API', 'APP', 'PC', 'MAC',
    'iOS', 'Xbox', 'Steam', 'Minecraft', 'FPS', 'MOBA', 'RPG', 'HDMI',
    'USB', 'RGB', 'DDR', 'Vlog', 'vlog', 'UP', 'BGM', 'MV', 'PV', 'OST',
    'GIF', 'UI', 'IT', 'GDP', 'CPI', 'CEO', 'CTO', 'CMO', 'Java', 'Python',
    'Rust', 'Go', 'Linux', 'Unix', 'Docker', 'Git', 'Switch', 'android',
    'iPhone', 'iPad', 'TypeC', 'typec', 'OS', 'DB', 'SQL', 'NoSQL', 'JSON',
    'XML', 'HTML', 'CSS', 'JS', 'TS', '3D', '2D', 'HD', 'FHD', 'UHD',
    'DC', 'AC', 'SaaS', 'PaaS', 'IaaS', 'IoT', 'NLP', 'CV', 'ML', 'DL',
    'DevOps', 'K8s', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala',
    'KPI', 'OKR', 'IPO', 'ERP', 'CRM', 'BI', 'CI', 'CD', 'SRE', 'QA',
    'APK', 'EXE', 'DOS', 'UX', 'OT', 'OA', 'BPM', 'SCM', 'MATLAB',
    'SPSS', 'SAS', 'PDF', 'WEBP', 'PNG', 'JPG', 'JPEG', 'SVG',
    'MP3', 'MP4', 'URL', 'HTTP', 'HTTPS', 'WWW', 'COM', 'NET', 'ORG'
  ]);

  var punctuationRegex = /[\d\s!@#$%^&*()+=\[\]{}"'\/\\<>,.?~`|，。！？、；：""''（）【】《》…—\n\r]/g;

  for (var ci = 0; ci < comments.length; ci++) {
    var rawText = comments[ci].text || '';
    var text = rawText.replace(punctuationRegex, ' ');

    // 1. 单独提取有意义的英文单词/缩写
    var englishMatches = text.match(/[a-zA-Z][a-zA-Z0-9]{1,}/g) || [];
    englishMatches.forEach(function(ew) {
      var upper = ew.toUpperCase();
      if (englishWhitelist.has(upper) || englishWhitelist.has(ew)) {
        var key = englishWhitelist.has(upper) ? upper : ew;
        wordFreq[key] = (wordFreq[key] || 0) + 1;
      } else if (ew.length >= 4 && /^[a-z]+$/i.test(ew)) {
        // 4+ 字符的纯字母词保留（可能是真实单词如 "code", "game"）
        var lower = ew.toLowerCase();
        wordFreq[lower] = (wordFreq[lower] || 0) + 1;
      }
    });

    // 2. 移除英文字母后做中文滑动窗口
    var cjkText = text.replace(/[a-zA-Z]+/g, ' ');
    var cleanText = cjkText.replace(/\s+/g, '');

    for (var len = 4; len >= 2; len--) {
      for (var i = 0; i <= cleanText.length - len; i++) {
        var word = cleanText.substring(i, i + len);

        // 必须包含至少一个 CJK 字符
        var hasCJK = false;
        for (var c = 0; c < word.length; c++) {
          if (isCJK(word.charAt(c))) { hasCJK = true; break; }
        }
        if (!hasCJK) continue;

        if (stopWords.has(word)) continue;

        if (len === 2) {
          var skip = false;
          for (var j = 0; j < word.length; j++) {
            if (stopWords.has(word.charAt(j))) { skip = true; break; }
          }
          if (skip) continue;
        }

        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }
  }

  // 按频率排序
  var sorted = Object.entries(wordFreq)
    .filter(function(e) { return e[1] >= 2; })
    .sort(function(a, b) { return b[1] - a[1]; });

  // 去重：如果一个词是另一个词的子串，且频率相同或更低，则移除
  var kept = [];
  for (var i = 0; i < sorted.length; i++) {
    var wordA = sorted[i][0];
    var freqA = sorted[i][1];
    var isSubstring = false;

    for (var k = 0; k < kept.length; k++) {
      var wordB = kept[k].word;
      var freqB = kept[k].count;

      if (wordB.indexOf(wordA) !== -1 && freqB >= freqA) {
        isSubstring = true;
        break;
      }
      if (wordA.indexOf(wordB) !== -1 && freqA > freqB) {
        kept.splice(k, 1);
        k--;
      }
    }

    if (!isSubstring) {
      kept.push({ word: wordA, count: freqA });
    }
  }

  return kept.slice(0, topN);
}

// 识别意见领袖(KOL)
export function identifyKOLs(comments, topN) {
  topN = topN || 5;
  const userStats = {};

  for (const c of comments) {
    const key = c.user || c.mid || 'unknown';
    if (!userStats[key]) {
      userStats[key] = {
        name: c.user || '匿名用户',
        avatar: c.avatar || '?',
        comments: 0,
        likes: 0,
        replies: 0,
        texts: []
      };
    }
    userStats[key].comments++;
    userStats[key].likes += (c.likes || 0);
    userStats[key].replies += (c.replies || 0);
    if (userStats[key].texts.length < 3) {
      userStats[key].texts.push(c.text || '');
    }
  }

  // 计算影响力分数: 评论数*30% + 点赞数*40% + 回复数*30%
  const kols = Object.values(userStats)
    .filter(function(u) { return u.comments >= 2 || u.likes >= 50; })
    .map(function(u) {
      const influence = Math.min(100, Math.round(
        (u.comments * 0.3 + u.likes * 0.4 + u.replies * 0.3) / 5
      ));
      return {
        name: u.name,
        avatar: u.avatar,
        comments: u.comments,
        likes: u.likes,
        replies: u.replies,
        fans: 0,
        influence: influence,
        verified: u.likes > 500,
        bio: u.comments > 10 ? '活跃评论者' : (u.likes > 200 ? '高赞用户' : '普通用户'),
        commentSample: {
          text: u.texts[0] || '',
          sentiment: analyzeSentiment(u.texts[0] || '').sentiment,
          likes: u.likes > 0 ? Math.floor(u.likes / u.comments) : 0,
          time: ''
        }
      };
    })
    .sort(function(a, b) { return b.influence - a.influence; })
    .slice(0, topN);

  return kols;
}
