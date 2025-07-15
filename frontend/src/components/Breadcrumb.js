import React from 'react';
import '../styles/Breadcrumb.css';

function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="fil d'ariane">
      <ol>
        {items.map((item, index) => (
          <li key={index} className={index === items.length - 1 ? 'active' : ''}>
            {index === items.length - 1 ? (
              <span>{item.label}</span>
            ) : (
              <a href="#" onClick={(e) => {
                e.preventDefault();
                if (item.onClick) item.onClick();
              }}>
                {index === 0 && <i className="fas fa-home"></i>}
                {index !== 0 && item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
