export const platformConfig = {
  bilibili: { name: 'B站', color: '#fb7299', icon: '📺' }
};

const topics = {
  tech: ['人工智能', '科技前沿', '数码产品', '编程开发', 'AI大模型', '元宇宙', '区块链', 'VR/AR', '芯片产业', '机器人'],
  life: ['美食探店', '旅行攻略', '健身运动', '宠物日常', '生活技巧', '手工DIY', '家居装修', '亲子教育', '时尚穿搭', '美妆护肤'],
  finance: ['投资理财', '股票分析', '经济趋势', '创业故事', '职场干货', '副业赚钱', '房地产', '消费降级', '数字人民币', '跨境电商'],
  game: ['王者荣耀', '原神', '英雄联盟', '和平精英', 'Steam游戏', '独立游戏', '电竞比赛', '游戏攻略', '主机游戏', '手游推荐'],
  education: ['考研备考', '英语学习', '编程入门', '读书分享', '学习方法', '出国留学', '职业规划', '自我提升', '时间管理', '心理学']
};

const sentimentWords = {
  positive: ['太棒了', '支持', '完美', '真心推荐', '绝了', '爱了爱了', '真香', '牛', 'yyds', '感动', '正能量', '厉害', '涨知识', '受益匪浅', '点赞', '期待', '超好看', '精华', '宝藏', 'nice', 'good', 'great', '佩服', '学习了', '受教了', '666', '太赞了', '有深度', '有价值', '干货'],
  negative: ['失望', '无聊', '浪费时间', '别被骗', '踩坑', '后悔', '无语', '骗钱', '垃圾', '取关', '没意思', '标题党', '水军', '不推荐', '差评', 'bug', '翻车', '尴尬', 'low', '无语子', '避雷', '劝退', '摆烂', '烂尾', '狗都不看', '浪费', '割韭菜', '智商税', '坑', '吐槽'],
  neutral: ['哈哈', '搞笑', '有趣', '好奇', '真的吗', '表示疑惑', '求关注', '同款', '蹲一个', '求链接', '在哪看', '我也想', '求解', '有没有', '求教', '感谢分享', 'mark', '马了', '打卡', '先码住', '回头看', '来晚了', '留名', '坐等', '前排', '路过', '围观', '不错', '还可以', '一般']
};

const commentTemplates = [
  '这个视频{sent}，{topic}确实是现在的热点。',
  '看了好几个同类视频，这个{sent}。{topic}这个话题很有意思。',
  '博主讲的{topic}非常到位，{sent}。',
  '作为一个{topic}爱好者，这个内容{sent}。',
  '终于有人讲清楚{topic}了，{sent}。',
  '{topic}这个领域水太深了，博主分析得{sent}。',
  '刚入门{topic}，这个视频让我{sent}。',
  '视频太短了，关于{topic}还想了解更多，{sent}。',
  '已经三连支持了，{topic}这个选题{sent}。',
  '在这个频道学到了好多{topic}知识，{sent}。'
];

const kolNames = [
  '科技老炮儿', '数码评测君', 'AI前沿速递', '程序员小王', '产品经理日记',
  '吃货探店侠', '环球旅行家', '健身达人阿强', '萌宠日常', '家居设计师',
  '股市风向标', '财经老李', '创业真相君', '职场成长社', '副业女王',
  '游戏解说大神', '电竞观察员', '独立游戏鉴赏', '考研辅导名师', '英语学霸',
  '读书博主', '心理学博士', '时间管理专家', '穿搭达人', '美妆教主',
  '育儿干货王', '亲子游戏家', '手工创意人', '美食烘焙师', '摄影艺术家'
];

const userNames = [
  '科技前沿小李', '数码控小王', 'AI观察员', '编程少年', '产品汪的日常',
  '吃货日记', '旅行青蛙', '健身狂魔', '喵星人铲屎官', '家居改造王',
  '韭菜盒子', '理财小白', '创业梦想家', '职场打工人', '自由职业者',
  '电竞选手', '游戏一生推', '主机党', '考研加油', '英语学习者',
  '读书破万卷', '心理学爱好者', '效率控', '穿搭狂魔', '美妆菜鸟',
  '宝妈日常', '亲子游戏家', '手工爱好者', '美食博主', '摄影小白'
];

const cityLocations = [
  { name: '北京', value: [116.4, 39.9] },
  { name: '上海', value: [121.47, 31.23] },
  { name: '广州', value: [113.27, 23.13] },
  { name: '深圳', value: [114.05, 22.54] },
  { name: '杭州', value: [120.15, 30.28] },
  { name: '成都', value: [104.06, 30.67] },
  { name: '武汉', value: [114.3, 30.6] },
  { name: '西安', value: [108.95, 34.27] },
  { name: '南京', value: [118.78, 32.04] },
  { name: '重庆', value: [106.54, 29.59] },
  { name: '长沙', value: [112.98, 28.19] },
  { name: '苏州', value: [120.58, 31.3] },
  { name: '厦门', value: [118.08, 24.47] },
  { name: '青岛', value: [120.38, 36.07] },
  { name: '大连', value: [121.62, 38.92] },
  { name: '天津', value: [117.2, 39.13] },
  { name: '昆明', value: [102.73, 25.04] },
  { name: '哈尔滨', value: [126.63, 45.75] },
  { name: '沈阳', value: [123.43, 41.8] },
  { name: '郑州', value: [113.65, 34.76] },
  { name: '济南', value: [117.0, 36.65] },
  { name: '合肥', value: [117.27, 31.86] },
  { name: '福州', value: [119.3, 26.08] },
  { name: '南昌', value: [115.89, 28.68] },
  { name: '南宁', value: [108.37, 22.82] },
  { name: '贵阳', value: [106.71, 26.57] },
  { name: '兰州', value: [103.82, 36.06] },
  { name: '乌鲁木齐', value: [87.62, 43.79] },
  { name: '拉萨', value: [91.11, 29.97] },
  { name: '海口', value: [110.33, 20.03] },
  { name: '三亚', value: [109.51, 18.25] }
];

const overseaLocations = [
  { name: '东京', value: [139.69, 35.69] },
  { name: '首尔', value: [126.97, 37.57] },
  { name: '新加坡', value: [103.85, 1.35] },
  { name: '曼谷', value: [100.5, 13.75] },
  { name: '巴黎', value: [2.35, 48.86] },
  { name: '纽约', value: [-74.0, 40.71] },
  { name: '伦敦', value: [-0.13, 51.51] },
  { name: '悉尼', value: [151.21, -33.87] }
];

const catNames = {
  tech: '科技数码', life: '生活方式', finance: '财经商业',
  game: '游戏娱乐', education: '教育培训'
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN(arr, n) {
  const result = [];
  const copy = arr.slice();
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function generateSentiment(type) {
  const words = sentimentWords[type];
  return pickRandom(words);
}

function pickRandomTopic() {
  const allTopics = Object.values(topics).flat();
  return pickRandom(allTopics);
}

function generateComment(type, topicCat) {
  const template = pickRandom(commentTemplates);
  const sentWord = generateSentiment(type);
  const topic = topicCat ? pickRandom(topics[topicCat]) : pickRandomTopic();
  return template.replace('{sent}', sentWord).replace('{topic}', topic);
}

export function generateUserProfile(options = {}) {
  const username = options.username || pickRandom(userNames);
  const platform = options.platform || 'bilibili';
  const range = options.range || 30;

  const catKeys = Object.keys(topics);
  const primaryCat = pickRandom(catKeys);
  const secondaryCat = pickRandomN(catKeys.filter(function(k) { return k !== primaryCat; }), 2);

  const interestDistribution = {};
  interestDistribution[primaryCat] = 0;
  secondaryCat.forEach(function(c) { interestDistribution[c] = 0; });

  const posts = Math.floor(Math.random() * 200) + 50;
  const comments = Math.floor(Math.random() * 5000) + 500;
  const forwards = Math.floor(Math.random() * 2000) + 200;
  const likes = Math.floor(Math.random() * 100000) + 1000;
  const fans = Math.floor(Math.random() * 50000) + 500;

  for (const cat of Object.keys(interestDistribution)) {
    interestDistribution[cat] = cat === primaryCat
      ? Math.floor(Math.random() * 40) + 40
      : Math.floor(Math.random() * 20) + 5;
  }

  const total = Object.values(interestDistribution).reduce(function(a, b) { return a + b; }, 0);
  for (const cat of Object.keys(interestDistribution)) {
    interestDistribution[cat] = Math.round((interestDistribution[cat] / total) * 100);
  }

  const sentiment = {
    positive: Math.floor(Math.random() * 40) + 30,
    neutral: Math.floor(Math.random() * 30) + 20,
    negative: 0
  };
  sentiment.negative = 100 - sentiment.positive - sentiment.neutral;

  const trendData = [];
  const trendLabels = [];
  const days = range === 'all' ? 30 : parseInt(range);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trendLabels.push((date.getMonth() + 1) + '/' + date.getDate());
    trendData.push(Math.floor(Math.random() * 100) + 20);
  }

  let level = 'C级';
  let levelColor = '#95a5a6';
  if (fans > 10000) { level = 'A级'; levelColor = '#ff4757'; }
  else if (fans > 5000) { level = 'B级'; levelColor = '#ffa502'; }
  else if (fans > 1000) { level = 'C级'; levelColor = '#feca57'; }

  const tags = [
    catNames[primaryCat],
    platformConfig[platform].name + '活跃用户',
    range >= 30 ? '月度活跃' : '短期活跃',
    sentiment.positive > 40 ? '正能量' : sentiment.negative > 25 ? '批判性' : '理性'
  ];

  const primaryCatName = catNames[primaryCat];
  const primaryCatPct = interestDistribution[primaryCat];
  const secondaryCatNames = secondaryCat.map(function(c) { return catNames[c]; }).join('、');
  const platformName = platformConfig[platform].name;
  const rangeText = range === 'all' ? '30' : range;
  const sentimentDesc = sentiment.positive > sentiment.negative ? '正面' : '负面';

  const summary = '【' + username + '】是' + platformName + '平台的一位' + primaryCatName + '领域创作者/活跃用户。\n\n' +
    '📊 数据概览：\n' +
    '• 近' + rangeText + '天发布内容 ' + posts + ' 条，评论 ' + comments + ' 条，转发 ' + forwards + ' 条\n' +
    '• 累计获赞 ' + likes.toLocaleString() + ' 次，粉丝 ' + fans.toLocaleString() + ' 人\n' +
    '• 属于' + level + '影响力用户\n\n' +
    '🎯 核心画像：\n' +
    '• 主要关注领域：' + primaryCatName + '，占比约 ' + primaryCatPct + '%\n' +
    '• 次要关注：' + secondaryCatNames + '\n' +
    '• 情感倾向：正面 ' + sentiment.positive + '%，中性 ' + sentiment.neutral + '%，负面 ' + sentiment.negative + '%\n\n' +
    '💡 分析结论：该用户在' + primaryCatName + '领域有较深参与度，情感态度偏' + sentimentDesc + '。';

  const postWordCloudData = [];
  const postWords = topics[primaryCat].slice();
  const extraWords = ['干货', '教程', '测评', '实战', '入门', '深度解析', '最新进展', '趋势', '排行榜', '推荐', '分享', '心得', '经验', '避坑指南', '对比', '评测', '盘点', '合集', '精选', '必看'];
  const allWords = postWords.concat(extraWords);
  const shuffledWords = allWords.sort(function() { return Math.random() - 0.5; });
  for (let i = 0; i < Math.min(25, shuffledWords.length); i++) {
    postWordCloudData.push({
      name: shuffledWords[i],
      value: Math.floor(Math.random() * 200) + 10
    });
  }

  const participatedTopics = [];
  const usedTopics = {};
  for (let i = 0; i < 12; i++) {
    let topic;
    do { topic = pickRandomTopic(); } while (usedTopics[topic]);
    usedTopics[topic] = true;
    participatedTopics.push({
      name: topic,
      count: Math.floor(Math.random() * 150) + 5,
      category: catNames[pickRandom(catKeys)]
    });
  }
  participatedTopics.sort(function(a, b) { return b.count - a.count; });

  const relNodes = [];
  const relLinks = [];
  const relNames = pickRandomN(userNames.concat(kolNames), 12);
  relNodes.push({ id: '该用户', name: '该用户', category: 3, value: 10 });
  for (let i = 0; i < relNames.length; i++) {
    relNodes.push({ id: relNames[i], name: relNames[i], category: i < 4 ? 1 : 2, value: Math.floor(Math.random() * 8) + 2 });
  }
  for (let i = 0; i < 8; i++) {
    const target = relNames[i];
    relLinks.push({ source: '该用户', target: target, type: 'outgoing', label: '@' + (Math.floor(Math.random() * 8) + 1) + '次' });
  }
  for (let i = 8; i < relNames.length; i++) {
    const target = relNames[i];
    relLinks.push({ source: target, target: '该用户', type: 'incoming', label: '被@' + (Math.floor(Math.random() * 5) + 1) + '次' });
  }
  for (let i = 0; i < 3; i++) {
    const a = relNames[i];
    const b = relNames[i + 3];
    relLinks.push({ source: a, target: b, type: 'mutual', label: '互相关注' });
  }

  const likeRanking = [];
  const likeNames = pickRandomN(userNames.concat(kolNames), 10);
  for (let i = 0; i < likeNames.length; i++) {
    const likes = Math.floor(Math.random() * 8000) + 200;
    likeRanking.push({
      rank: i + 1,
      user: likeNames[i],
      likes: likes
    });
  }
  likeRanking.sort(function(a, b) { return b.likes - a.likes; });
  likeRanking.forEach(function(k, i) { k.rank = i + 1; });

  const commentRanking = [];
  const commentNames = pickRandomN(userNames.concat(kolNames), 10);
  for (let i = 0; i < commentNames.length; i++) {
    const comments = Math.floor(Math.random() * 200) + 10;
    const replies = Math.floor(comments * (Math.random() * 0.6 + 0.2));
    commentRanking.push({
      rank: i + 1,
      user: commentNames[i],
      comments: comments,
      replies: replies
    });
  }
  commentRanking.sort(function(a, b) { return (b.comments + b.replies) - (a.comments + a.replies); });
  commentRanking.forEach(function(k, i) { k.rank = i + 1; });

  const videoLocations = [];
  const usedCities = {};
  const domesticCount = Math.min(10, cityLocations.length);
  for (let i = 0; i < domesticCount; i++) {
    let city;
    do { city = pickRandom(cityLocations); } while (usedCities[city.name]);
    usedCities[city.name] = true;
    const cnt = Math.floor(Math.random() * 30) + 1;
    videoLocations.push({
      name: city.name,
      value: city.value.concat([cnt]),
      count: cnt,
      date: '2024-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
      isOversea: false
    });
  }

  const overseaCount = Math.floor(Math.random() * 3) + 1;
  const usedOversea = {};
  for (let i = 0; i < overseaCount; i++) {
    let city;
    do { city = pickRandom(overseaLocations); } while (usedOversea[city.name]);
    usedOversea[city.name] = true;
    const cnt = Math.floor(Math.random() * 15) + 1;
    videoLocations.push({
      name: city.name,
      value: city.value.concat([cnt]),
      count: cnt,
      date: '2024-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
      isOversea: true
    });
  }

  return {
    username: username,
    platform: platform,
    range: range,
    posts: posts,
    comments: comments,
    forwards: forwards,
    likes: likes,
    fans: fans,
    level: level,
    levelColor: levelColor,
    tags: tags,
    interestDistribution: Object.fromEntries(
      Object.entries(interestDistribution).map(function(entry) {
        return [catNames[entry[0]] || entry[0], entry[1]];
      })
    ),
    sentiment: sentiment,
    trendData: trendData,
    trendLabels: trendLabels,
    summary: summary,
    catNames: catNames,
    postWordCloudData: postWordCloudData,
    participatedTopics: participatedTopics,
    relNodes: relNodes,
    relLinks: relLinks,
    likeRanking: likeRanking,
    commentRanking: commentRanking,
    videoLocations: videoLocations
  };
}

export function generateVideoAnalysis(options = {}) {
  const videoUrl = options.videoUrl || '';
  const platform = options.platform || 'bilibili';
  const scope = options.scope || 5000;
  const model = options.model || 'emotion';

  const catKeys = Object.keys(topics);
  const catWeights = catKeys.map(function() { return Math.random(); });
  const totalWeight = catWeights.reduce(function(a, b) { return a + b; }, 0);
  const normalizedWeights = catWeights.map(function(w) { return w / totalWeight; });

  let dominantCat = 0;
  for (let i = 1; i < normalizedWeights.length; i++) {
    if (normalizedWeights[i] > normalizedWeights[dominantCat]) dominantCat = i;
  }

  const category = catKeys[dominantCat];
  const topicPool = topics[category];

  const videoTitle = pickRandom([
    '【深度解析】' + pickRandom(topicPool) + '行业最新动态',
    pickRandom(topicPool) + '你真的了解吗？看完这个视频你就懂了',
    '震惊！' + pickRandom(topicPool) + '的真相竟然是这样',
    pickRandom(topicPool) + '入门指南，小白也能看懂',
    '从0到1搞懂' + pickRandom(topicPool) + '，一篇就够了'
  ]);

  const videoAuthor = pickRandom(kolNames);
  const videoStats = (Math.floor(Math.random() * 900) + 100) + 'w播放 · ' + (Math.floor(Math.random() * 50) + 5) + 'w点赞';

  const publishDate = new Date();
  publishDate.setDate(publishDate.getDate() - Math.floor(Math.random() * 14));
  const publishTime = publishDate.getFullYear() + '-' +
    String(publishDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(publishDate.getDate()).padStart(2, '0');

  const sentimentBase = {
    general: { positive: 35, neutral: 45, negative: 20 },
    emotion: { positive: 42, neutral: 38, negative: 20 },
    news: { positive: 30, neutral: 50, negative: 20 }
  }[model];

  let sentPositive = sentimentBase.positive + Math.floor(Math.random() * 10) - 5;
  let sentNeutral = sentimentBase.neutral + Math.floor(Math.random() * 10) - 5;
  let sentNegative = sentimentBase.negative + Math.floor(Math.random() * 10) - 5;
  const sentTotal = sentPositive + sentNeutral + sentNegative;
  sentPositive = Math.round((sentPositive / sentTotal) * 100);
  sentNeutral = Math.round((sentNeutral / sentTotal) * 100);
  sentNegative = 100 - sentPositive - sentNeutral;

  const sentiment = {
    positive: sentPositive,
    neutral: sentNeutral,
    negative: sentNegative
  };

  const commentCount = Math.floor((scope === 'all' ? 5000 : scope) * 0.7);

  const perSent = {
    positive: Math.floor(commentCount * sentiment.positive / 100),
    neutral: Math.floor(commentCount * sentiment.neutral / 100),
    negative: 0
  };
  perSent.negative = commentCount - perSent.positive - perSent.neutral;

  const hotTopics = [];
  const topicFreq = {};
  for (let i = 0; i < topicPool.length; i++) {
    topicFreq[topicPool[i]] = Math.floor(Math.random() * 800) + 50;
  }
  Object.entries(topicFreq)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 10)
    .forEach(function(entry) {
      hotTopics.push({ topic: entry[0], count: entry[1] });
    });

  const kols = [];
  const kolCount = Math.min(10, Math.floor(Math.random() * 6) + 5);
  const usedNames = {};
  for (let i = 0; i < kolCount; i++) {
    let name;
    do { name = pickRandom(kolNames); } while (usedNames[name]);
    usedNames[name] = true;
    const kComments = Math.floor(Math.random() * 500) + 20;
    const kLikes = Math.floor(Math.random() * 5000) + 100;
    const kFans = Math.floor(Math.random() * 100000) + 1000;
    const influenceScore = Math.min(100, Math.round((kComments * 0.3 + kLikes * 0.4 + kFans * 0.05) / 50));
    kols.push({
      rank: i + 1,
      name: name,
      comments: kComments,
      likes: kLikes,
      fans: kFans,
      influence: influenceScore,
      verified: Math.random() > 0.5,
      bio: pickRandom([
        '深耕' + pickRandom(topicPool) + '领域多年',
        '全网粉丝百万的' + pickRandom(['科技', '生活', '财经', '游戏']) + '博主',
        '资深' + pickRandom(['自媒体人', '内容创作者', '行业分析师']),
        '专注' + pickRandom(topicPool) + '内容分享'
      ])
    });
  }
  kols.sort(function(a, b) { return b.influence - a.influence; });
  kols.forEach(function(k, i) {
    k.rank = i + 1;
    const kSent = ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)];
    k.commentSample = {
      text: generateComment(kSent, category),
      sentiment: kSent,
      likes: Math.floor(Math.random() * 2000) + 100,
      time: (Math.floor(Math.random() * 12) + 1) + '-' + (Math.floor(Math.random() * 28) + 1) + ' ' +
        String(Math.floor(Math.random() * 24)).padStart(2, '0') + ':' +
        String(Math.floor(Math.random() * 60)).padStart(2, '0')
    };
  });

  const commentSamples = [];
  const sampleUsers = userNames.slice(0, 30);

  const sampleCount = Math.min(commentCount, 50);
  for (let i = 0; i < sampleCount; i++) {
    let sent;
    if (i < perSent.positive) sent = 'positive';
    else if (i < perSent.positive + perSent.neutral) sent = 'neutral';
    else sent = 'negative';

    const text = generateComment(sent, category);
    const user = pickRandom(sampleUsers);
    const daysAgo = Math.floor(Math.random() * 14);
    const time = new Date();
    time.setDate(time.getDate() - daysAgo);

    commentSamples.push({
      user: user,
      avatar: user.charAt(0),
      text: text,
      sentiment: sent,
      sentimentScore: sent === 'positive' ? Math.random() * 0.3 + 0.7 : sent === 'negative' ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.3,
      time: (time.getMonth() + 1) + '-' + time.getDate() + ' ' +
        String(time.getHours()).padStart(2, '0') + ':' +
        String(time.getMinutes()).padStart(2, '0'),
      likes: Math.floor(Math.random() * 500),
      replies: Math.floor(Math.random() * 50),
      isKOL: false,
      userTag: Math.random() > 0.7 ? pickRandom(['VIP', '认证', '铁粉', '新用户']) : ''
    });
  }

  commentSamples.sort(function(a, b) { return b.likes - a.likes; });

  const trendDays = 7;
  const trendData = { positive: [], neutral: [], negative: [], labels: [] };
  for (let i = trendDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trendData.labels.push((date.getMonth() + 1) + '/' + date.getDate());
    const base = Math.random() * 100 + 20;
    trendData.positive.push(Math.floor(base * sentiment.positive / 100 + Math.random() * 20));
    trendData.neutral.push(Math.floor(base * sentiment.neutral / 100 + Math.random() * 20));
    trendData.negative.push(Math.floor(base * sentiment.negative / 100 + Math.random() * 20));
  }

  return {
    videoTitle: videoTitle,
    videoAuthor: videoAuthor,
    videoStats: videoStats,
    videoUrl: videoUrl,
    platform: platform,
    publishTime: publishTime,
    category: category,
    sentiment: sentiment,
    sentimentCounts: {
      positive: perSent.positive,
      neutral: perSent.neutral,
      negative: perSent.negative
    },
    totalComments: commentCount,
    hotTopics: hotTopics,
    kols: kols,
    comments: commentSamples,
    trendData: trendData
  };
}
