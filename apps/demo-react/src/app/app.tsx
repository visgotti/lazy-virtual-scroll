import React, { useState, useMemo } from 'react';
import LazyVirtualScroll, { type Dataset, type LoadEventPayload } from '@lazy-virtual-scroll/react';
import ScrollPropControls, { ScrollProps } from './ScrollPropControls';
import './app.scss';

function generateMockDatasets(totalItems: number, itemsPerDataset: number): Dataset[] {
  const datasets: Dataset[] = [];

  for (let i = 0; i < totalItems; i += itemsPerDataset) {
    const data = Array.from({ length: itemsPerDataset }, (_, j) => ({ name: `Item ${i + j}`, isExpanded: false }));
    datasets.push({
      startingIndex: i,
      data,
    });
  }
  return datasets;
}

const App: React.FC = () => {
  const [scrollProps, setScrollProps] = useState<ScrollProps>({
    itemSize: 65,
    itemBuffer: 3,
    totalItems: 300,
    scrollStart: 0,
    scrollThrottle: 0,
    scrollDebounce: 100,
    minItemSize: 0,
    autoDetectSizes: true,
    direction: 'column',
    sortDatasets: true
  });
  
  const [testLoadedCount] = useState(200);
  const [openItems, setOpenItems] = useState<{ [itemIndex: string]: number }>({});

  const expandedItemHeight = 500;

  const datasets = useMemo(() => generateMockDatasets(testLoadedCount, 10), [testLoadedCount]);

  const formattedDatasets = useMemo(() => {
    return datasets.map((d: Dataset) => ({
      startingIndex: d.startingIndex,
      data: d.data.map((item, i) => ({
        ...item,
        isExpanded: (d.startingIndex + i) in openItems,
      })),
    }));
  }, [datasets, openItems]);

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
  };

  const handleLoad = (v: LoadEventPayload) => {
    console.log('handleLoad', v);
  };

  const actualItemCount = useMemo(() => {
    return formattedDatasets.reduce((acc, dataset) => acc + dataset.data.length, 0);
  }, [formattedDatasets]);

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
          <h1>Lazy Virtual List Example</h1>
          <p className="subtitle">Efficient rendering of large datasets with dynamic sizing and lazy loading</p>
          
          <div className={`demo-container ${scrollProps.direction === 'row' ? 'horizontal' : ''}`}>
            <LazyVirtualScroll
              className="demo"
              onLoad={handleLoad}
              datasets={formattedDatasets}
              totalItems={scrollProps.totalItems}
              itemSize={scrollProps.itemSize}
              itemBuffer={scrollProps.itemBuffer}
              autoDetectSizes={scrollProps.autoDetectSizes}
              dynamicSizes={openItems}
              scrollDebounce={scrollProps.scrollDebounce}
              scrollThrottle={scrollProps.scrollThrottle}
              direction={scrollProps.direction}
              sortDatasets={scrollProps.sortDatasets}
              minItemSize={scrollProps.minItemSize}
              scrollStart={scrollProps.scrollStart}
              renderLoading={(index: number) => (
                <div className="item loading">
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <span>Loading item {index}...</span>
                  </div>
                </div>
              )}
              render={(index: number, item: any) => (
                <div className={`item${(index in openItems) ? ' expanded' : ''}`}>
                  <div className="item-header">
                    <div className="item-title">{item.name}</div>
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
              )}
            />
          </div>
          
          <div className="stats-panel">
            <div className="stat">
              <div className="stat-value">{actualItemCount}</div>
              <div className="stat-label">Loaded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{Object.keys(openItems).length}</div>
              <div className="stat-label">Expanded Items</div>
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
