import React from 'react';
import { CATEGORIES, PRICE_TYPES, SORT_OPTIONS } from '../../utils/constants';

export default function ResourceFilters({ filters, onChange, onReset, total }) {
  const handle = (key, value) => onChange({ ...filters, [key]: value });

  const pill = (label, active, onClick) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
        background: active ? '#0EA5E9' : 'transparent',
        border: `1px solid ${active ? '#0EA5E9' : '#334155'}`,
        color: active ? '#fff' : '#94A3B8',
        fontSize: 12, fontWeight: active ? 600 : 400,
        transition: 'all 0.2s', whiteSpace: 'nowrap',
      }}
    >{label}</button>
  );

  return (
    <div style={{ background: '#1E293B', borderBottom: '1px solid #334155', padding: '12px 24px', position: 'sticky', top: 64, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '0 0 220px' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>🔍</span>
            <input
              value={filters.search || ''}
              onChange={(e) => handle('search', e.target.value)}
              placeholder="Search resources..."
              style={{
                width: '100%', background: '#0F172A', border: '1px solid #334155',
                borderRadius: 10, padding: '7px 10px 7px 32px',
                color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ width: 1, height: 24, background: '#334155' }} />

          {/* Categories */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto' }}>
            {pill('All', !filters.category, () => handle('category', ''))}
            {CATEGORIES.map(({ value, icon }) =>
              pill(`${icon} ${value}`, filters.category === value, () => handle('category', value))
            )}
          </div>

          <div style={{ width: 1, height: 24, background: '#334155' }} />

          {/* Price Types */}
          <div style={{ display: 'flex', gap: 6 }}>
            {pill('Any Price', !filters.priceType, () => handle('priceType', ''))}
            {PRICE_TYPES.map(({ value, icon }) =>
              pill(`${icon} ${value}`, filters.priceType === value, () => handle('priceType', value))
            )}
          </div>

          {/* Sort */}
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handle('sortBy', e.target.value)}
            style={{
              background: '#0F172A', border: '1px solid #334155',
              borderRadius: 10, padding: '6px 10px', color: '#94A3B8',
              fontSize: 12, outline: 'none', marginLeft: 'auto',
            }}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Count + reset */}
          <span style={{ color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>{total} results</span>

          {(filters.search || filters.category || filters.priceType) && (
            <button onClick={onReset} style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 12, cursor: 'pointer' }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
