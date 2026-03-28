import React, { useRef, useState } from 'react';
import './VideoCard.css';

export default function VideoCard({ item, isActive }) {
  const iframeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Only build the embed URL when this card is active or has been loaded
  const embedUrl = isActive || loaded
    ? `${item.embedUrl}&autoplay=${isActive ? 1 : 0}&mute=1`
    : null;

  return (
    <div className="video-card">
      {!loaded && !isActive && (
        <div className="video-card__thumb">
          <img
            src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
            alt={item.title}
            className="video-card__thumb-img"
          />
          <div className="video-card__thumb-overlay">▶</div>
        </div>
      )}
      {(isActive || loaded) && (
        <iframe
          ref={iframeRef}
          className="video-card__iframe"
          src={embedUrl}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          frameBorder="0"
        />
      )}
      <div className="video-card__overlay">
        <div className="video-card__title">{item.title}</div>
      </div>
    </div>
  );
}
