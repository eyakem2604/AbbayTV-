// Simple script to help add news
const fs = require('fs');

function addNewsItem(newsData) {
  // Read existing news
  const news = JSON.parse(fs.readFileSync('news.json', 'utf8'));
  
  // Find next ID
  const nextId = Math.max(...news.map(item => item.id)) + 1;
  
  // Add new item
  const newItem = {
    id: nextId,
    ...newsData,
    date: new Date().toISOString().split('T')[0]
  };
  
  news.push(newItem);
  
  // Save back
  fs.writeFileSync('news.json', JSON.stringify(news, null, 2));
  
  // Update index.json stats
  const index = JSON.parse(fs.readFileSync('index.json', 'utf8'));
  index.stats.news_count = news.length;
  fs.writeFileSync('index.json', JSON.stringify(index, null, 2));
  
  console.log(`✅ News item ${nextId} added successfully!`);
}

// Usage example:
const newNews = {
  title: "Your Headline Here",
  description: "Your full news content here...",
  category: "Politics",
  youtube_url: "https://youtu.be/YOUR_VIDEO_ID",
  is_featured: true,
  author: "Reporter Name",
  read_time: "4 min"
};

addNewsItem(newNews);