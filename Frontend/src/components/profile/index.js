// ─── components/profile/TrustScore.jsx ───────────────────────────────────────
import React from 'react';

export function TrustScore({ score = 0, total = 0, size = 'md' }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const starSize = size === 'lg' ? 20 : 14;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex' }}>
        {stars.map((s) => (
          <span key={s} style={{ color: s <= Math.round(score) ? '#F59E0B' : '#334155', fontSize: starSize }}>★</span>
        ))}
      </div>
      <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: size === 'lg' ? 18 : 13 }}>
        {score > 0 ? score.toFixed(1) : '—'}
      </span>
      <span style={{ color: '#64748B', fontSize: 12 }}>({total} reviews)</span>
    </div>
  );
}

// ─── components/profile/ProfileCard.jsx ──────────────────────────────────────
export function ProfileCard({ user, isOwnProfile, onEditClick, onMessage }) {
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div style={{
      background: '#1E293B', border: '1px solid #334155',
      borderRadius: 20, padding: 28,
    }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 28, fontWeight: 700, flexShrink: 0,
          border: '3px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          {user?.profilePicture
            ? <img src={user.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials
          }
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: '#F1F5F9', fontFamily: "'Syne', sans-serif", fontSize: 22, margin: '0 0 4px' }}>
                {user?.firstName} {user?.lastName}
                {user?.isEmailVerified && <span style={{ color: '#10B981', fontSize: 14, marginLeft: 8 }}>✓</span>}
              </h2>
              <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>🏫 {user?.university}</p>
              {user?.department && <p style={{ color: '#64748B', fontSize: 13, margin: '2px 0 0' }}>📚 {user.department} · Year {user.year}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isOwnProfile && onMessage && (
                <button onClick={onMessage} style={{
                  background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', border: 'none',
                  borderRadius: 10, padding: '7px 16px', color: '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}>💬 Message</button>
              )}
              {isOwnProfile && (
                <button onClick={onEditClick} style={{
                  background: 'transparent', border: '1px solid #334155',
                  borderRadius: 10, padding: '7px 14px', color: '#94A3B8',
                  cursor: 'pointer', fontSize: 13,
                }}>✏️ Edit Profile</button>
              )}
            </div>
          </div>

          {user?.bio && (
            <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>{user.bio}</p>
          )}

          <div style={{ marginTop: 12 }}>
            <TrustScore score={user?.trustScore} total={user?.totalRatings} />
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── components/profile/ReviewList.jsx ───────────────────────────────────────
export function ReviewList({ reviews, isLoading }) {
  const { Spinner } = require('../common/Spinner');
  const { timeAgo, getInitials } = require('../../utils/helpers');

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>;

  if (!reviews?.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
      <p>No reviews yet</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reviews.map((review) => (
        <div key={review._id} style={{
          background: '#0F172A', borderRadius: 12,
          padding: 16, border: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {review.reviewer?.profilePicture
                ? <img src={review.reviewer.profilePicture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(review.reviewer?.firstName, review.reviewer?.lastName)
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>
                  {review.reviewer?.firstName} {review.reviewer?.lastName}
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ color: i < review.rating ? '#F59E0B' : '#334155', fontSize: 14 }}>★</span>
                  ))}
                </div>
              </div>
              {review.comment && <p style={{ color: '#94A3B8', fontSize: 13, margin: '6px 0 8px', lineHeight: 1.6 }}>{review.comment}</p>}
              {review.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {review.tags.map((tag) => (
                    <span key={tag} style={{ background: '#0EA5E911', color: '#0EA5E9', border: '1px solid #0EA5E933', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{tag}</span>
                  ))}
                </div>
              )}
              <p style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>{timeAgo(review.createdAt)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
