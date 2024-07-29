import React, { useState, useMemo } from 'react';
import LazyVirtualScroll, { type Dataset, type LoadEventPayload } from 'react-lazy-virtual-scroll';
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
  const [totalItems] = useState(300);
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
      delete openItems[index];
      setOpenItems({ ...openItems })
    } else {
      setOpenItems({ 
        ...openItems,
        [index]: expandedItemHeight
      })
    }
  }

  const handleLoad = (v: LoadEventPayload) => {
    console.log('handleLoad', v);
  };

  return (
    <div>
      <h1>Lazy Virtual List Example</h1>
      <div className="wrapper">
        <LazyVirtualScroll
          className="demo"
          onLoad={handleLoad}
          datasets={formattedDatasets}
          totalItems={totalItems}
          itemSize={65}
          itemBuffer={3}
          autoDetectSizes
          dynamicSizes={openItems}
          scrollDebounce={100}
          scrollThrottle={0}
          renderLoading={(index: number) => {
            return (
              <div className="item loading"> Loading... {index} </div>
            )
          }}
          render={(index: number, item: any) => {
            return (
              <div className={`item${(index in openItems) ? ' expanded' : ''}`}>
                ITEM: { index  }
                {
                  item.isExpanded && (
                    <span onClick={(e) => handleToggleExpand(index)}>▲</span>
                  )
                }
                {
                  !item.isExpanded && (
                    <span onClick={() => handleToggleExpand(index)}>▼</span>
                  )
                }
                {
                  item.isExpanded && (
                    <div
                      style={{
                        height: `${openItems[index]}px`,
                        minHeight:  `${openItems[index]}px`,
                      }}
                    />
                  )
                }
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default App;
