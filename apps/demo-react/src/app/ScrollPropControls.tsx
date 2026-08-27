import React, { useState, useEffect, useId } from 'react';
import { ScrollProps, defaultScrollProps } from '@lazy-virtual-scroll/core';
import './ScrollPropControls.scss';

interface ScrollPropControlsProps {
  scrollProps: ScrollProps;
  onChange: (props: ScrollProps) => void;
  /**
   * The props this example was seeded with. Reset restores these rather than the
   * library defaults, which would drop a per-example direction/itemSize.
   */
  defaults?: ScrollProps;
}

const ScrollPropControls: React.FC<ScrollPropControlsProps> = ({ scrollProps, onChange, defaults }) => {
  // Scopes this instance's DOM ids: the page renders one panel per example.
  const idPrefix = useId();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [localProps, setLocalProps] = useState<ScrollProps>({ ...defaultScrollProps, ...scrollProps });

  useEffect(() => {
    onChange(localProps);
  }, [localProps, onChange]);

  const handleChange = (key: keyof ScrollProps, value: any) => {
    setLocalProps((prev: ScrollProps) => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setLocalProps(defaults ?? {
      ...defaultScrollProps,
      totalItems: 300,
    });
  };

  return (
    <div className={`scroll-prop-controls ${!isExpanded ? 'collapsed' : ''}`}>
      <div className="header-row">
        <div className="header-left">
          <h3>Control Panel</h3>
          <span className="badge">{localProps.autoDetectSizes ? 'Dynamic Sizing' : 'Fixed Sizing'}</span>
        </div>
        <button className="toggle-button" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>

      {isExpanded && (
        <div className="control-content">
          <div className="control-tabs">
            <button 
              className={activeTab === 'basic' ? 'active' : ''} 
              onClick={() => setActiveTab('basic')}>
              Basic
            </button>
            <button 
              className={activeTab === 'advanced' ? 'active' : ''} 
              onClick={() => setActiveTab('advanced')}>
              Advanced
            </button>
            <button 
              className={activeTab === 'performance' ? 'active' : ''} 
              onClick={() => setActiveTab('performance')}>
              Performance
            </button>
          </div>

          {activeTab === 'basic' && (
            <div className="control-panel">
              <div className="control-grid">
                <div className="control-item range">
                  <div className="control-header">
                    <label htmlFor={`${idPrefix}-totalItems`}>
                      Total Items
                      <span className="tooltip" data-tip="Total number of items to render in the list">ⓘ</span>
                    </label>
                    <span className="value">{localProps.totalItems}</span>
                  </div>
                  <input
                    id={`${idPrefix}-totalItems`}
                    type="range"
                    min="10"
                    max="10000"
                    step="10"
                    value={localProps.totalItems}
                    onChange={(e) => handleChange('totalItems', parseInt(e.target.value))}
                  />
                </div>

                <div className="control-item">
                  <label htmlFor={`${idPrefix}-autoDetectSizes`}>
                    Auto Detect Sizes
                    <span className="tooltip" data-tip="Automatically detect and adjust to variable item sizes">ⓘ</span>
                  </label>
                  <div className="toggle-switch">
                    <input
                      id={`${idPrefix}-autoDetectSizes`}
                      type="checkbox"
                      checked={localProps.autoDetectSizes}
                      onChange={(e) => handleChange('autoDetectSizes', e.target.checked)}
                    />
                    <label 
                      htmlFor={`${idPrefix}-autoDetectSizes`}
                      className="slider-container"
                    >
                      <span className="slider"></span>
                      <span className="label-left">Off</span>
                      <span className="label-right">On</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="control-panel">
              <div className="control-grid">
                <div className="control-item range">
                  <div className="control-header">
                    <label htmlFor={`${idPrefix}-itemBuffer`}>
                      Item Buffer
                      <span className="tooltip" data-tip="Number of items to render beyond visible area">ⓘ</span>
                    </label>
                    <span className="value">{localProps.itemBuffer}</span>
                  </div>
                  <input
                    id={`${idPrefix}-itemBuffer`}
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={localProps.itemBuffer}
                    onChange={(e) => handleChange('itemBuffer', parseInt(e.target.value))}
                  />
                </div>

                <div className="control-item range">
                  <div className="control-header">
                    <label htmlFor={`${idPrefix}-scrollStart`}>
                      Scroll Start Position
                      <span className="tooltip" data-tip="Initial scroll position in pixels">ⓘ</span>
                    </label>
                    <span className="value">{localProps.scrollStart}px</span>
                  </div>
                  <input
                    id={`${idPrefix}-scrollStart`}
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={localProps.scrollStart}
                    onChange={(e) => handleChange('scrollStart', parseInt(e.target.value))}
                  />
                </div>

                <div className="control-item range">
                  <div className="control-header">
                    <label htmlFor={`${idPrefix}-minItemSize`}>
                      Min Item Size
                      <span className="tooltip" data-tip="Minimum height/width for items with dynamic sizing">ⓘ</span>
                    </label>
                    <span className="value">{localProps.minItemSize}px</span>
                  </div>
                  <input
                    id={`${idPrefix}-minItemSize`}
                    type="range"
                    min="0"
                    max="400"
                    step="5"
                    value={localProps.minItemSize}
                    onChange={(e) => handleChange('minItemSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="control-item">
                  <label htmlFor={`${idPrefix}-sortDatasets`}>
                    Sort Datasets
                    <span className="tooltip" data-tip="Whether to sort datasets by their starting index">ⓘ</span>
                  </label>
                  <div className="toggle-switch">
                    <input
                      id={`${idPrefix}-sortDatasets`}
                      type="checkbox"
                      checked={localProps.sortDatasets}
                      onChange={(e) => handleChange('sortDatasets', e.target.checked)}
                    />                    
                    <label 
                      htmlFor={`${idPrefix}-sortDatasets`}
                      className="slider-container"
                    >
                      <span className="slider"></span>
                      <span className="label-left">Off</span>
                      <span className="label-right">On</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="control-panel">
              <div className="control-grid">
                <div className="control-item range">
                  <div className="control-header">
                    <label htmlFor={`${idPrefix}-scrollThrottle`}>
                      Scroll Throttle
                      <span className="tooltip" data-tip="Sets the throttling time for scroll events in milliseconds">ⓘ</span>
                    </label>
                    <span className="value">{localProps.scrollThrottle}ms</span>
                  </div>
                  <input
                    id={`${idPrefix}-scrollThrottle`}
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={localProps.scrollThrottle}
                    onChange={(e) => handleChange('scrollThrottle', parseInt(e.target.value))}
                  />
                </div>

                <div className="control-item range">
                  <div className="control-header">
                    <label htmlFor={`${idPrefix}-scrollDebounce`}>
                      Scroll Debounce
                      <span className="tooltip" data-tip="Sets the debounce time for scroll events in milliseconds">ⓘ</span>
                    </label>
                    <span className="value">{localProps.scrollDebounce}ms</span>
                  </div>
                  <input
                    id={`${idPrefix}-scrollDebounce`}
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={localProps.scrollDebounce}
                    onChange={(e) => handleChange('scrollDebounce', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="control-actions">
            <button className="reset-button" onClick={resetToDefaults}>
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollPropControls;
