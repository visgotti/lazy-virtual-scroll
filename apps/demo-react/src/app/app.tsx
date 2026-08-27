import React, { useState, useMemo } from 'react';
import LazyVirtualScroll, { type Dataset, type LoadEventPayload } from '@lazy-virtual-scroll/react';
import { 
  ScrollProps, 
  defaultScrollProps
} from '@lazy-virtual-scroll/core';
import { 
  MockDataItem,
  loadDatasetWithDelay,
  getLoremText
} from '@lazy-virtual-scroll/shared-mock';
import ScrollPropControls from './ScrollPropControls';
import './app.scss';

const useVirtualListDemo = (initialProps: Partial<ScrollProps> = {}) => {
  const initialScrollProps: ScrollProps = {
    ...defaultScrollProps,
    totalItems: 300,
    ...initialProps
  };
  const [scrollProps, setScrollProps] = useState<ScrollProps>(initialScrollProps);
  const [openItems, setOpenItems] = useState<{ [itemIndex: string]: number }>({});
  const [loadedDatasets, setLoadedDatasets] = useState<Dataset[]>([]);
  const [itemShowCounts, setItemShowCounts] = useState<{ [key: number]: number }>({});
  const [hiddenItems, setHiddenItems] = useState<Set<number>>(new Set());

  // Size the item grows to along the scroll axis when expanded (height for a
  // column, width for a row) - this is what the library tracks via dynamicSizes.
  const expandedItemSize = 500;

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
        [index]: expandedItemSize
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

  return {
    scrollProps,
    setScrollProps,
    initialScrollProps,
    openItems,
    handleToggleExpand,
    formattedDatasets,
    handleLoad,
    handleHide,
    uniqueLoadedItemsCount
  };
};

const App: React.FC = () => {
  const verticalDemo = useVirtualListDemo({ direction: 'column' });
  const horizontalDemo = useVirtualListDemo({ direction: 'row', itemSize: 250 });

  // A row-direction list is sized along its width, so the expanded size and the
  // item's own box have to follow that axis - otherwise the box the user sees and
  // the extent the scroller reserves are two unrelated numbers.
  const itemStyle = (demo: ReturnType<typeof useVirtualListDemo>, size: number): React.CSSProperties | undefined =>
    demo.scrollProps.direction === 'row'
      ? { width: size, minWidth: size, maxWidth: size, height: '100%', borderBottom: 'none', borderRight: '1px solid #e2e8f0' }
      : undefined;

  const renderItem = (demo: ReturnType<typeof useVirtualListDemo>) => (index: number, item: MockDataItem & { showCount: number }) => {
    const horizontal = demo.scrollProps.direction === 'row';
    const size = demo.openItems[index] ?? demo.scrollProps.itemSize;
    return (
      <div className={`item${(index in demo.openItems) ? ' expanded' : ''}`} style={itemStyle(demo, size)}>
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
                demo.handleToggleExpand(index);
              }}
            >
              {item.isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
        
        {item.isExpanded && (
          <div className="item-content"
            style={horizontal ? undefined : {
              height: `${demo.openItems[index]}px`,
              minHeight: `${demo.openItems[index]}px`,
            }}
          >
            <div className="item-details">
              <div className="item-section">
                <h4>Item Details</h4>
                <p>ID: <strong>{index}</strong></p>
                <p>Size: <strong>{demo.openItems[index]}px</strong></p>
                <p>Type: <strong>Expandable</strong></p>
              </div>
              <div className="item-section">
                <h4>Content Preview</h4>
                <div className="item-preview">
                  <p className="preview-text">{getLoremText(index)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLoading = (demo: ReturnType<typeof useVirtualListDemo>) => (index: number) => (
    <div className="item" style={itemStyle(demo, demo.scrollProps.itemSize)}>
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
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo">
            <span className="logo-text">Lazy<span className="highlight">Virtual</span>Scroll</span>
          </div>
          <span className="version">React Demo v1.1.0</span>
        </div>
      </header>
      
      <main className="app-content">
        
        <div className="demo-section">
          <h1>Lazy Virtual List - React Example</h1>
          <p className="subtitle">Efficient rendering of large datasets with dynamic sizing and lazy loading</p>
          
          <h2>Vertical Scroll</h2>
          <ScrollPropControls scrollProps={verticalDemo.scrollProps} onChange={verticalDemo.setScrollProps} defaults={verticalDemo.initialScrollProps} />
          <div className="demo-container">
            <LazyVirtualScroll
              className="demo"
              onLoad={verticalDemo.handleLoad}
              onHide={verticalDemo.handleHide}
              datasets={verticalDemo.formattedDatasets}
              totalItems={verticalDemo.scrollProps.totalItems}
              itemSize={verticalDemo.scrollProps.itemSize}
              itemBuffer={verticalDemo.scrollProps.itemBuffer}
              autoDetectSizes={verticalDemo.scrollProps.autoDetectSizes}
              dynamicSizes={verticalDemo.openItems}
              scrollDebounce={verticalDemo.scrollProps.scrollDebounce}
              scrollThrottle={verticalDemo.scrollProps.scrollThrottle}
              sortDatasets={verticalDemo.scrollProps.sortDatasets}
              minItemSize={verticalDemo.scrollProps.minItemSize}
              scrollStart={verticalDemo.scrollProps.scrollStart}
              direction={verticalDemo.scrollProps.direction}
              renderLoading={renderLoading(verticalDemo)}
              render={renderItem(verticalDemo)}
            />
          </div>
          
          <div className="stats-panel">
            <div className="stat">
              <div className="stat-value">{Object.keys(verticalDemo.openItems).length}</div>
              <div className="stat-label">Expanded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{verticalDemo.uniqueLoadedItemsCount}</div>
              <div className="stat-label">Loaded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{verticalDemo.scrollProps.totalItems}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>

          <div style={{ height: '50px' }}></div>

          <h2>Horizontal Scroll</h2>
          <ScrollPropControls scrollProps={horizontalDemo.scrollProps} onChange={horizontalDemo.setScrollProps} defaults={horizontalDemo.initialScrollProps} />
          <div className="demo-container horizontal" style={{ height: '300px' }}>
            <LazyVirtualScroll
              className="demo"
              onLoad={horizontalDemo.handleLoad}
              onHide={horizontalDemo.handleHide}
              datasets={horizontalDemo.formattedDatasets}
              totalItems={horizontalDemo.scrollProps.totalItems}
              itemSize={horizontalDemo.scrollProps.itemSize}
              itemBuffer={horizontalDemo.scrollProps.itemBuffer}
              autoDetectSizes={horizontalDemo.scrollProps.autoDetectSizes}
              dynamicSizes={horizontalDemo.openItems}
              scrollDebounce={horizontalDemo.scrollProps.scrollDebounce}
              scrollThrottle={horizontalDemo.scrollProps.scrollThrottle}
              sortDatasets={horizontalDemo.scrollProps.sortDatasets}
              minItemSize={horizontalDemo.scrollProps.minItemSize}
              scrollStart={horizontalDemo.scrollProps.scrollStart}
              direction={horizontalDemo.scrollProps.direction}
              renderLoading={renderLoading(horizontalDemo)}
              render={renderItem(horizontalDemo)}
            />
          </div>
          
          <div className="stats-panel">
            <div className="stat">
              <div className="stat-value">{Object.keys(horizontalDemo.openItems).length}</div>
              <div className="stat-label">Expanded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{horizontalDemo.uniqueLoadedItemsCount}</div>
              <div className="stat-label">Loaded Items</div>
            </div>
            <div className="stat">
              <div className="stat-value">{horizontalDemo.scrollProps.totalItems}</div>
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
