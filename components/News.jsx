import React from 'react';
import { Link } from 'react-router';

const feedwind = `
<script src="//feed.mikle.com/js/rssmikle.js"></script>
<script>
(function() {
  var params = {
    rssmikle_url: "http://bulbanews.bulbagarden.net/feed/news.rss",
    rssmikle_frame_width: "360",
    rssmikle_frame_height: "900",
    frame_height_by_article: "8",
    rssmikle_target: "_blank",
    rssmikle_font: "Arial, Helvetica, sans-serif",
    rssmikle_font_size: "16",
    rssmikle_border: "off",
    responsive: "on",
    rssmikle_css_url: "https://pokemapper.co/static/rss.css",
    text_align: "left",
    text_align2: "left",corner: "off",
    scrollbar: "off",
    autoscroll: "off",
    scrolldirection: "up",
    scrollstep: "3",
    mcspeed: "20",
    sort: "Off",
    rssmikle_title: "off",
    rssmikle_title_sentence: "Latest Pokemon GO News",
    rssmikle_title_link: "https://pokemapper.co",
    rssmikle_title_bgcolor: "#0066FF",
    rssmikle_title_color: "#FFFFFF",
    rssmikle_title_bgimage: "",
    rssmikle_item_bgcolor: "#FFFFFF",
    rssmikle_item_bgimage: "",
    rssmikle_item_title_length: "100",
    rssmikle_item_title_color: "#0a8b9e",
    rssmikle_item_border_bottom: "on",
    rssmikle_item_description: "on",
    item_link: "off",
    rssmikle_item_description_length: "600",
    rssmikle_item_description_color: "#333333",
    rssmikle_item_date: "gl1",
    rssmikle_timezone: "Etc/GMT",
    datetime_format: "%b %e, %Y",
    item_description_style: "text+tn",
    item_thumbnail: "full",
    item_thumbnail_selection: "auto",
    article_num: "15",
    rssmikle_item_podcast: "off",
    keyword_inc: "",
    keyword_exc: ""
  };
  feedwind_show_widget_iframe(params);
})();
</script>
<div style="font-size:10px; text-align:center; ">
  <a href="http://feed.mikle.com/" target="_blank" style="color:#CCCCCC;" rel="nofollow">RSS Feed Widget</a>
</div>
`;


const News = () => (
  <div
    style={{
        boxSizing: 'border-box',
        position: 'fixed',
        zIndex: 100000,
        top: 41,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'white',
        overflowY: 'auto',
        padding: '3em 4%',
    }}
  >
    <h2>Latest Pokémon GO News</h2>
    <div style={{ margin: '0 auto', maxWidth: 640 }}>
      <div dangerouslySetInnerHTML={{ __html: feedwind }} />
    </div>
  </div>
);


export default News;
