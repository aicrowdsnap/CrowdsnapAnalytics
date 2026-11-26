import React from 'react';

export interface ImageHeader {
  name: string;
  imageUrl?: string;
}

interface HeaderRendererProps {
  header: string | ImageHeader;
  maxHeight?: string;
  maxWidth?: string;
  showLabel?: boolean;
}

export const renderImageHeader = (
  header: string | ImageHeader,
  maxHeight = 'h-6',
  maxWidth = 'w-6',
  showLabel = true
) => {
  if (typeof header === 'string') {
    return <span>{header}</span>;
  }

  if (!header) {
    return <span>—</span>;
  }

  const imageUrl = (header as ImageHeader).imageUrl;
  const name = (header as ImageHeader).name;

  if (imageUrl) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={imageUrl}
          alt={name || 'Header'}
          className={`${maxWidth} ${maxHeight} object-cover rounded`}
          title={name}
        />
        {showLabel && name && <span className="text-xs">{name}</span>}
      </div>
    );
  }

  return <span>{name || '—'}</span>;
};

export const ImageHeaderRenderer: React.FC<HeaderRendererProps> = ({
  header,
  maxHeight = 'h-6',
  maxWidth = 'w-6',
  showLabel = true,
}) => {
  if (!header) {
    return <span>—</span>;
  }

  if (typeof header === 'string') {
    return <span>{header}</span>;
  }

  const imageUrl = (header as ImageHeader).imageUrl;
  const name = (header as ImageHeader).name;

  if (imageUrl) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={imageUrl}
          alt={name || 'Header'}
          className={`${maxWidth} ${maxHeight} object-cover rounded`}
          title={name}
        />
        {showLabel && name && <span className="text-xs">{name}</span>}
      </div>
    );
  }

  return <span>{name || '—'}</span>;
};
