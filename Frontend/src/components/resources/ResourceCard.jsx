import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { timeAgo, getInitials, getImageUrl } from '../../utils/helpers';

const CATEGORY_ICONS = {
  Books: '📚', Notes: '📝', Electronics: '💻',
  'Lab Tools': '🔬', Stationery: '✏️', Software: '💿', Other: '📦',
};

const AVATAR_COLORS = ['#0EA5E9', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ResourceCard({ resource, isBookmarked, onBookmark }) {
  const [hovered, setHovered] = useState(false);
  const avatarBg = AVATAR_COLORS[resource._id?.charCodeAt(0) % AVATAR_COLORS.length] || '#0EA5E9';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#273344' : '#1E293B',
        border: `1px solid ${hovered ? '#0EA5E9' : '#334155'}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(14,165,233,0.2)' : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160 }}>
        {resource.images?.[0]?.url ? (
          <img
            src={getImageUrl(resource.images[0].url, 400, 300)}
            alt={resource.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            height: '100%',
            background: `linear-gradient(135deg, ${avatarBg}22, ${avatarBg}44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, borderBottom: '1px solid #334155',
          }}>
            {CATEGORY_ICONS[resource.category] || '📦'}
          </div>
        )}

        {/* Badges overlay */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <Badge type="category">{resource.category}</Badge>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <button
            onClick={(e) => { e.preventDefault(); onBookmark && onBookmark(resource._id); }}
            style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid #334155',
              borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
              color: isBookmarked ? '#F59E0B' : '#64748B', fontSize: 16,
            }}
          >{isBookmarked ? '★' : '☆'}</button>
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
          <Badge type="price">{resource.priceType}</Badge>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to={`/resources/${resource._id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            color: '#F1F5F9', fontSize: 14, fontWeight: 600, margin: 0,
            lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif",
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{resource.title}</h3>
        </Link>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge>{resource.condition}</Badge>
          <span style={{ color: '#64748B', fontSize: 11 }}>📍 {resource.university}</span>
        </div>

        {/* Price */}
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
          {resource.priceType === 'Free' && <span style={{ color: '#4ADE80' }}>FREE</span>}
          {resource.priceType === 'Exchange' && <span style={{ color: '#C084FC' }}>Exchange</span>}
          {resource.priceType === 'Rent' && <span style={{ color: '#FCD34D' }}>${resource.price}<span style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8' }}>/mo</span></span>}
          {resource.priceType === 'Sale' && <span style={{ color: '#60A5FA' }}>${resource.price}</span>}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to={`/profile/${resource.postedBy?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 700,
            }}>
              {resource.postedBy?.profilePicture
                ? <img src={resource.postedBy.profilePicture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(resource.postedBy?.firstName, resource.postedBy?.lastName)
              }
            </div>
            <span style={{ color: '#94A3B8', fontSize: 11 }}>
              {resource.postedBy?.firstName} {resource.postedBy?.lastName}
            </span>
          </Link>
          <span style={{ color: '#64748B', fontSize: 11 }}>{timeAgo(resource.createdAt)}</span>
        </div>

        <div style={{ display: 'flex', gap: 12, color: '#64748B', fontSize: 11 }}>
          <span>👁 {resource.views || 0}</span>
          <span>★ {resource.bookmarkCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
