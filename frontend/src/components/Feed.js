import React, { useEffect, useRef, useCallback, useState } from 'react';
import VideoCard from './VideoCard';
import AdCard from './AdCard';
import './Feed.css';

export default function Feed({ items, loading, onLoadMore, userId, onRewardEarned }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const touchStartY = useRef(null);
  const scrollTimeout = useRef(null);

  // Scroll to a specific index
  const scrollToIndex = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });
  }, []);

  // Track which item is in view using IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index, 10);
            setActiveIndex(index);

            // Load more when near end
            if (index >= items.length - 3) {
              onLoadMore?.();
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const slides = container.querySelectorAll('.feed__slide');
    slides.forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [items, onLoadMore]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        scrollToIndex(Math.min(activeIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        scrollToIndex(Math.max(activeIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, items.length, scrollToIndex]);

  // Touch swipe support
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;
    if (Math.abs(deltaY) < 50) return; // ignore small swipes
    if (deltaY > 0) {
      scrollToIndex(Math.min(activeIndex + 1, items.length - 1));
    } else {
      scrollToIndex(Math.max(activeIndex - 1, 0));
    }
  }, [activeIndex, items.length, scrollToIndex]);

  // Mouse wheel snap
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (scrolling) return;
    setScrolling(true);
    if (e.deltaY > 0) {
      scrollToIndex(Math.min(activeIndex + 1, items.length - 1));
    } else {
      scrollToIndex(Math.max(activeIndex - 1, 0));
    }
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setScrolling(false), 600);
  }, [activeIndex, items.length, scrollToIndex, scrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      className="feed"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {items.map((item, index) => (
        <div key={item.id} className="feed__slide" data-index={index}>
          {item.type === 'video' ? (
            <VideoCard item={item} isActive={index === activeIndex} />
          ) : (
            <AdCard
              item={item}
              userId={userId}
              onRewardEarned={onRewardEarned}
            />
          )}

          {/* Swipe hint on first item */}
          {index === 0 && (
            <div className="feed__swipe-hint">
              <span>↑</span>
              <span className="feed__swipe-hint-text">Swipe up</span>
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="feed__slide feed__slide--loading">
          <div className="feed__loader">
            <div className="feed__loader-spinner" />
            <span>Loading more…</span>
          </div>
        </div>
      )}
    </div>
  );
}
