import React, { useState, useMemo } from 'react';
import LazyVirtualScroll, { type Dataset, type LoadEventPayload } from '@lazy-virtual-scroll/react';
import { 
  ScrollProps, 
  defaultScrollProps
} from '@lazy-virtual-scroll/core';
import { 
  MockDataItem,
  loadDatasetWithDelay
} from '@lazy-virtual-scroll/shared-mock';
import ScrollPropControls from './ScrollPropControls';
import './app.scss';

const App: React.FC = () => {
  const [scrollProps, setScrollProps] = useState<ScrollProps>({
    totalItems: 300,
    ...defaultScrollProps,
  });
  const [openItems, setOpenItems] = useState<{ [itemIndex: string]: number }>({});
  const [loadedDatasets, setLoadedDatasets] = useState<Dataset[]>([]);
  const [itemShowCounts, setItemShowCounts] = useState<{ [key: number]: number }>({});
  const [hiddenItems, setHiddenItems] = useState<Set<number>>(new Set());

  const expandedItemHeight = 500;

  const formattedDatasets = useMemo(() => {
    return loadedDatasets.map((d: Dataset) => ({
      startingIndex: d.startingIndex,
      data: d.data.map((item, i) => {
        const itemIndex = d.startingIndex + i;
        return {
          ...item as object,
          isExpanded: itemIndex in openItems,
          showCount: itemShowCounts[itemIndex] || 0,
        };
      }),
    }));
  }, [loadedDatasets, openItems, itemShowCounts]);

  const handleToggleExpand = (index: number) => {
    if(index in openItems) {
      const newOpenItems = { ...openItems };
      delete newOpenItems[index];
      setOpenItems(newOpenItems);
    } else {
      setOpenItems({ 
        ...openItems,
        [index]: expandedItemHeight
      });
    }
  };  const handleLoad = (v: LoadEventPayload) => {
    // When items need to be loaded, this callback fires
    const startIndex = v.startIndex;
    const endIndex = v.endIndex;
    const itemCount = endIndex - startIndex + 1;
    
    // Update show counts for newly visible items
    setItemShowCounts(prev => {
      const newCounts = { ...prev };
      for (let i = startIndex; i <= endIndex; i++) {
        // Increment count if item was previously hidden or if it's the first time
        if (hiddenItems.has(i) || !(i in newCounts)) {
          newCounts[i] = (newCounts[i] || 0) + 1;
        }
      }
      return newCounts;
    });
    
    // Remove items from hidden set since they're now visible
    setHiddenItems(prev => {
      const newHidden = new Set(prev);
      for (let i = startIndex; i <= endIndex; i++) {
        newHidden.delete(i);
      }
      return newHidden;
    });
    
    // Check if we already have this data loaded
    const alreadyLoaded = loadedDatasets.some(dataset => 
      dataset.startingIndex <= startIndex && 
      (dataset.startingIndex + dataset.data.length) >= (startIndex + itemCount)
    );
    
    if (alreadyLoaded) {
      // Data is already loaded, no need to fetch again
      return;
    }
    
    // Simulate fetching data
    loadDatasetWithDelay(startIndex, itemCount)
      .then((loadedDataset) => {
        // Add the loaded dataset
        setLoadedDatasets(prev => [...prev, loadedDataset]);
      })
      .catch((error) => {
        console.error('Failed to load dataset:', error);
      });
  };

  const handleHide = (v: LoadEventPayload) => {
    // When items go out of view, mark them as hidden
    const startIndex = v.startIndex;
    const endIndex = v.endIndex;
    
    setHiddenItems(prev => {
      const newHidden = new Set(prev);
      for (let i = startIndex; i <= endIndex; i++) {
        newHidden.add(i);
      }
      return newHidden;
    });
  };

  // Compute unique loaded items count
  const uniqueLoadedItemsCount = useMemo(() => {
    const loadedIndexes = new Set<number>();
    loadedDatasets.forEach(dataset => {
      for (let i = 0; i < dataset.data.length; i++) {
        loadedIndexes.add(dataset.startingIndex + i);
      }
    });
    return loadedIndexes.size;
  }, [loadedDatasets]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo">
            <span className="logo-text">Lazy<span className="highlight">Virtual</span>Scroll</span>
          </div>
          <span className="version">React Demo v1.0.0</span>
        </div>
      </header>
      
      <main className="app-content">
        <ScrollPropControls scrollProps={scrollProps} onChange={setScrollProps} />
        
        <div className="demo-section">
          <h1>Lazy Virtual List - React Example</h1>
          <p className="subtitle">Efficient rendering of large datasets with dynamic sizing and lazy loading</p>
          
          <div className="demo-container">
            <LazyVirtualScroll
              className="demo"
              onLoad={handleLoad}
              onHide={handleHide}
              datasets={formattedDatasets}
              totalItems={scrollProps.totalItems}
              itemSize={65}
              itemBuffer={scrollProps.itemBuffer}
              autoDetectSizes={scrollProps.autoDetectSizes}
              dynamicSizes={openItems}
              scrollDebounce={scrollProps.scrollDebounce}
              scrollThrottle={scrollProps.scrollThrottle}
              sortDatasets={scrollProps.sortDatasets}
              minItemSize={scrollProps.minItemSize}
              scrollStart={scrollProps.scrollStart}
              renderLoading={(index: number) => (
                <div className="item">
                  <div className="item-header">
                    <div className="item-title">
                      <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <span>Loading item {index}...</span>
                        <div className="loading-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{
                                width: '50%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button 
                        className="expand-button" 
                        style={{visibility: 'hidden'}}
                      >
                        <span>▼</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              render={(index: number, item: MockDataItem & { showCount: number }) => {
                // Just render the regular item, loading is handled by renderLoading

                return (
                <div className={`item${(index in openItems) ? ' expanded' : ''}`}>
                  <div className="item-header">
                    <div className="item-title">
                      {item.name}
                      <span className="show-count-badge">Shown: {item.showCount}x</span>
                    </div>
                    <div className="item-actions">
                      <button 
                        className="expand-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(index);
                        }}
                      >
                        {item.isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>
                  
                  {item.isExpanded && (
                    <div className="item-content"
                      style={{
                        height: `${openItems[index]}px`,
                        minHeight: `${openItems[index]}px`,
                      }}
                    >
                      <div className="item-details">
                        <div className="item-section">
                          <h4>Item Details</h4>
                          <p>ID: <strong>{index}</strong></p>
                          <p>Size: <strong>{openItems[index]}px</strong></p>
                          <p>Type: <strong>Expandable</strong></p>
                        </div>
                        <div className="item-section">
                          <h4>Content Preview</h4>
                          <div className="item-preview">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className="preview-line"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              }}
            />
          </div>
          
          <div className="stats-panel">
            <div className="stat">
              <div className="stat-value">{Object.keys(openItems).length}</div>
              <div className="stat-label">Expanded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{uniqueLoadedItemsCount}</div>
              <div className="stat-label">Loaded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{scrollProps.totalItems}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            &copy; 2025 Lazy Virtual Scroll. Released under MIT License.
            <a href="https://github.com/visgotti/lazy-virtual-scroll" target="_blank" rel="noreferrer" className="footer-link">GitHub</a>
            <a href="https://www.npmjs.com/package/@lazy-virtual-scroll/react" target="_blank" rel="noreferrer" className="footer-link">NPM</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
