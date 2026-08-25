import * as echarts from 'echarts';

const chartInstances = {};

function getOrCreateChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].dispose();
  }
  const dom = document.getElementById(id);
  if (!dom) return null;
  const chart = echarts.init(dom);
  chartInstances[id] = chart;
  return chart;
}

window.addEventListener('resize', () => {
  Object.values(chartInstances).forEach(c => c && c.resize());
});

export function renderProfileTrendChart(data, labels) {
  const chart = getOrCreateChart('profileTrendChart');
  if (!chart) return;
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#333',
      textStyle: { color: '#fff' }
    },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#999', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      data: data,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#ff4757', width: 3 },
      itemStyle: { color: '#ff4757' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,71,87,0.4)' },
          { offset: 1, color: 'rgba(255,71,87,0.05)' }
        ])
      }
    }]
  });
}

export function renderProfileInterestChart(interestData) {
  const chart = getOrCreateChart('profileInterestChart');
  if (!chart) return;
  const entries = Object.entries(interestData);
  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {c}%',
        fontSize: 11
      },
      data: entries.map(([name, value]) => ({ name, value })),
      color: ['#ff4757', '#00d4ff', '#ffd93d', '#2ed573', '#ffa502', '#a55eea']
    }]
  });
}

export function renderProfileSentimentChart(sentiment) {
  const chart = getOrCreateChart('profileSentimentChart');
  if (!chart) return;
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' }
    },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b|{b}}  {c|{c}%}',
        rich: {
          b: { fontSize: 13, fontWeight: 'bold', color: '#333' },
          c: { fontSize: 13, color: '#333', padding: [0, 0, 0, 4] }
        }
      },
      labelLine: { length: 10, length2: 8 },
      data: [
        { name: '正面', value: sentiment.positive, itemStyle: { color: '#2ed573' } },
        { name: '中性', value: sentiment.neutral, itemStyle: { color: '#c8cdd5' } },
        { name: '负面', value: sentiment.negative, itemStyle: { color: '#ff4757' } }
      ]
    }]
  });
}

export function renderProfileWordCloudChart(wordData) {
  const chart = getOrCreateChart('profileWordCloudChart');
  if (!chart) return;
  const maxVal = Math.max(...wordData.map(w => w.value));
  const colors = ['#ff4757', '#ff6b81', '#00d4ff', '#2ed573', '#ffd93d', '#ffa502', '#a55eea', '#778ca3', '#26de81', '#fc5c65'];

  const sortedData = wordData
    .map((w, i) => ({ ...w, originalIndex: i }))
    .sort((a, b) => b.value - a.value);

  chart.setOption({
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' },
      formatter: (params) => `${params.name}<br/>词频: ${params.value}`
    },
    series: [{
      type: 'pie',
      radius: '85%',
      center: ['50%', '50%'],
      startAngle: 90,
      roseType: 'area',
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: (params) => {
          return `{a|${params.name}} {b|${params.value}}`;
        },
        rich: {
          a: { fontSize: 14, fontWeight: 'bold', color: '#333' },
          b: { fontSize: 11, color: '#999', padding: [0, 0, 0, 6] }
        }
      },
      labelLine: { length: 8, length2: 12 },
      data: sortedData.map((w) => ({
        name: w.name,
        value: w.value,
        itemStyle: { color: colors[w.originalIndex % colors.length] }
      }))
    }]
  });
}

export function renderProfileRelationChart(relData) {
  const chart = getOrCreateChart('profileRelationChart');
  if (!chart) return;
  const { nodes, links } = relData;

  const categories = [
    { name: '该用户@别人' },
    { name: '别人@该用户' },
    { name: '互相关注' }
  ];

  const chartNodes = nodes.map(n => ({
    id: n.name,
    name: n.name,
    category: n.category - 1,
    symbolSize: n.id === '该用户' ? 60 : 30 + n.value * 5,
    value: n.value,
    label: {
      show: true,
      fontSize: n.id === '该用户' ? 14 : 11,
      fontWeight: n.id === '该用户' ? 'bold' : 'normal'
    }
  }));

  const chartLinks = links.map(l => ({
    source: l.source,
    target: l.target,
    lineStyle: {
      color: l.type === 'mutual' ? '#ffd93d' : (l.type === 'outgoing' ? '#ff4757' : '#00d4ff'),
      width: l.type === 'mutual' ? 3 : 2,
      curveness: l.type === 'mutual' ? 0.2 : 0
    },
    label: {
      show: true,
      formatter: l.label,
      fontSize: 10,
      color: '#666'
    }
  }));

  chart.setOption({
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' }
    },
    legend: [{
      data: categories.map(c => c.name),
      top: 0,
      textStyle: { fontSize: 12 }
    }],
    series: [{
      type: 'graph',
      layout: 'force',
      categories: categories,
      roam: true,
      draggable: true,
      data: chartNodes,
      links: chartLinks,
      force: {
        repulsion: 120,
        edgeLength: [80, 150],
        gravity: 0.1
      },
      lineStyle: {
        opacity: 0.8
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 4 }
      }
    }]
  });
}

export function renderProfileLocationChart(locations) {
  const chart = getOrCreateChart('profileLocationChart');
  if (!chart) return;

  const domestic = locations.filter(function(l) { return !l.isOversea; });
  const maxCount = Math.max.apply(null, domestic.map(function(l) { return l.count; }));

  const scatterData = domestic.map(function(l) {
    return {
      name: l.name,
      value: [l.value[0], l.value[1]],
      count: l.count,
      date: l.date,
      symbolSize: 8 + (l.count / maxCount) * 20
    };
  });

  const mapRegistered = echarts.getMap('china');

  if (mapRegistered) {
    chart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.82)',
        borderColor: '#ff4757',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 12 },
        confine: true,
        formatter: function(params) {
          var d = params.data;
          if (!d || !d.count) return '';
          return '<div style="font-weight:600;font-size:13px;margin-bottom:4px;">📍 ' + d.name + '</div>' +
            '<div>视频数: <b style="color:#ffd93d">' + d.count + '</b></div>' +
            '<div>最近更新: ' + d.date + '</div>';
        }
      },
      geo: {
        map: 'china',
        roam: false,
        zoom: 1.15,
        center: [104, 36],
        tooltip: { show: false },
        label: {
          show: false
        },
        itemStyle: {
          areaColor: '#eef2f5',
          borderColor: '#b8c4ce',
          borderWidth: 0.8
        },
        emphasis: {
          disabled: true,
          itemStyle: { areaColor: '#dce4ec' },
          label: { show: false }
        },
        select: {
          itemStyle: { areaColor: '#dce4ec' },
          label: { show: false }
        }
      },
      series: [{
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData,
        tooltip: {
          show: true,
          formatter: function(params) {
            var d = params.data;
            if (!d || !d.count) return '';
            return '<div style="font-weight:600;font-size:13px;margin-bottom:4px;">📍 ' + d.name + '</div>' +
              '<div>视频数: <b style="color:#ffd93d">' + d.count + '</b></div>' +
              '<div>最近更新: ' + d.date + '</div>';
          }
        },
        rippleEffect: { brushType: 'stroke', scale: 3 },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          fontSize: 12,
          color: '#1a1a1a',
          fontWeight: 500,
          textBorderColor: '#fff',
          textBorderWidth: 3
        },
        itemStyle: {
          color: '#ff4757',
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(255,71,87,0.4)'
        },
        zlevel: 2
      }]
    }, true);
  } else {
    const maxLng = 135, minLng = 73;
    const maxLat = 54, minLat = 18;

    chart.setOption({
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderColor: '#ff4757',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: function(params) {
          var d = params.data;
          return '<div style="font-weight:600;font-size:13px;margin-bottom:4px;">📍 ' + d.name + '</div>' +
            '<div>视频数: <b style="color:#ffd93d">' + d.count + '</b></div>' +
            '<div>最近更新: ' + d.date + '</div>';
        }
      },
      xAxis: { type: 'value', min: minLng, max: maxLng, show: false },
      yAxis: { type: 'value', min: minLat, max: maxLat, show: false },
      grid: { left: 0, right: 0, top: 10, bottom: 30 },
      series: [{
        type: 'scatter',
        coordinateSystem: 'cartesian2d',
        zlevel: 2,
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          fontSize: 12,
          color: '#1a1a1a',
          fontWeight: 500,
          textBorderColor: '#fff',
          textBorderWidth: 3
        },
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
            { offset: 0, color: 'rgba(255,71,87,1)' },
            { offset: 0.7, color: 'rgba(255,71,87,0.6)' },
            { offset: 1, color: 'rgba(255,71,87,0)' }
          ]),
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 15,
          shadowColor: 'rgba(255,71,87,0.4)'
        },
        data: scatterData
      }]
    }, true);
  }
}

export function renderSentimentPieChart(sentiment) {
  const chart = getOrCreateChart('sentimentPieChart');
  if (!chart) return;
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' }
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        formatter: '{b}\n{c}%',
        fontSize: 12
      },
      data: [
        { name: '正面', value: sentiment.positive, itemStyle: { color: '#2ed573' } },
        { name: '中性', value: sentiment.neutral, itemStyle: { color: '#95a5a6' } },
        { name: '负面', value: sentiment.negative, itemStyle: { color: '#ff4757' } }
      ]
    }]
  });
}

export function renderSentimentTrendChart(trendData) {
  const chart = getOrCreateChart('sentimentTrendChart');
  if (!chart) return;
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['正面', '中性', '负面'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trendData.labels,
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#999', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: '正面',
        type: 'line',
        smooth: true,
        data: trendData.positive,
        itemStyle: { color: '#2ed573' },
        lineStyle: { width: 2 }
      },
      {
        name: '中性',
        type: 'line',
        smooth: true,
        data: trendData.neutral,
        itemStyle: { color: '#95a5a6' },
        lineStyle: { width: 2 }
      },
      {
        name: '负面',
        type: 'line',
        smooth: true,
        data: trendData.negative,
        itemStyle: { color: '#ff4757' },
        lineStyle: { width: 2 }
      }
    ]
  });
}

export function renderWordCloudChart(topics) {
  const chart = getOrCreateChart('wordCloudChart');
  if (!chart) return;
  const maxCount = Math.max(...topics.map(t => t.count));
  const minCount = Math.min(...topics.map(t => t.count));

  chart.setOption({
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      textStyle: { color: '#fff' },
      formatter: (params) => `${params.name}<br/>出现次数: ${params.value}`
    },
    series: [{
      type: 'pie',
      radius: '90%',
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: true,
        position: 'outside',
        formatter: (params) => {
          const fontSize = 12 + Math.floor((params.value - minCount) / (maxCount - minCount || 1) * 20);
          return `{a|${params.name}} {b|${params.value}}`;
        },
        rich: {
          a: { fontSize: 14, fontWeight: 'bold', color: '#333' },
          b: { fontSize: 11, color: '#999', padding: [0, 0, 0, 4] }
        }
      },
      labelLine: {
        length: 10,
        length2: 15
      },
      data: topics.map(t => ({ name: t.topic, value: t.count })),
      color: ['#ff4757', '#ff6b81', '#00d4ff', '#2ed573', '#ffd93d', '#ffa502', '#a55eea', '#778ca3', '#26de81', '#fc5c65']
    }]
  });
}
