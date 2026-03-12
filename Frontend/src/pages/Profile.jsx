import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResourceGrid from '../components/resources/ResourceGrid';
import Spinner from '../components/common/Spinner';
import { ProfileCard, ReviewList } from '../components/profile/index';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [resources, setResources] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resources');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/users/profile/${id}`),
          api.get(`/reviews/user/${id}`),
        ]);
        setProfile(profileRes.data.data.user);
        setResources(profileRes.data.data.resources);
        setReviews(reviewsRes.data.data.reviews);
      } catch { toast.error('Failed to load profile'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleMessage = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const { data } = await api.post('/messages', {
        recipientId: id,
        content: `Hi ${profile.firstName}! 👋`,
      });
      navigate(`/messages/${data.data.conversationId}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={48} /></div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>User not found</div>;

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <ProfileCard user={profile} isOwnProfile={user?._id === id} onMessage={handleMessage} />
      <div style={{ display: 'flex', gap: 4, marginTop: 32, marginBottom: 24, borderBottom: '1px solid #334155' }}>
        {[{ key: 'resources', label: `Resources (${resources.length})` }, { key: 'reviews', label: `Reviews (${reviews.length})` }].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === key ? '#0EA5E9' : 'transparent'}`, color: activeTab === key ? '#0EA5E9' : '#64748B', cursor: 'pointer', fontSize: 14, fontWeight: activeTab === key ? 600 : 400, fontFamily: "'DM Sans', sans-serif", marginBottom: -1 }}>{label}</button>
        ))}
      </div>
      {activeTab === 'resources' && <ResourceGrid resources={resources} isLoading={false} />}
      {activeTab === 'reviews' && <ReviewList reviews={reviews} isLoading={false} />}
    </div>
  );
}
