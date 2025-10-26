import React, { useEffect, useRef } from "react";

let tvScriptLoadingPromise;

const TradingViewWidget = ({ symbol, height = 400 }) => {
  console.log('TradingViewWidget received symbol:', symbol);
  const onLoadScriptRef = useRef();

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.id = "tradingview-widget-loading-script";
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.onload = resolve;

        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(
      () => onLoadScriptRef.current && onLoadScriptRef.current()
    );

    return () => (onLoadScriptRef.current = null);

    function createWidget() {
      console.log('Creating TradingView widget for symbol:', symbol);
      const containerId = `tradingview-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`;
      console.log('Container ID:', containerId);
      
      // Remove existing widget if it exists
      const existingWidget = document.getElementById(containerId);
      if (existingWidget) {
        existingWidget.innerHTML = '';
      }

      if (document.getElementById(containerId) && "TradingView" in window) {
        console.log('Creating TradingView widget with symbol:', symbol);
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol || "BTCUSD",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1e293b",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerId,
          height: height,
          width: "100%",
          hide_side_toolbar: false,
          save_image: false,
          details: true,
          hotlist: true,
          calendar: true,
          studies: [
            "Volume@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies"
          ],
          show_popup_button: true,
          popup_width: "1000",
          popup_height: "650",
        });
      }
    }
  }, [symbol, height]);

  const containerId = `tradingview-${symbol?.replace(/[^a-zA-Z0-9]/g, '') || 'default'}`;

  return (
    <div className="tradingview-widget-container">
      <div className="tradingview-header">
        <h3>📈 Price Chart</h3>
        <span className="symbol-display">{symbol || 'BTCUSD'}</span>
      </div>
      <div 
        id={containerId} 
        className="tradingview-widget"
        style={{ height: `${height}px`, width: '100%' }}
      />
      
      <style jsx="true">{`
        .tradingview-widget-container {
          background: #1e293b;
          border-radius: 16px;
          border: 1px solid #475569;
          padding: 20px;
          margin: 20px 0;
          overflow: hidden;
        }

        .tradingview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #475569;
        }

        .tradingview-header h3 {
          color: #f1f5f9;
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .symbol-display {
          color: #f59e0b;
          font-size: 14px;
          font-weight: 600;
          background: #334155;
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid #475569;
        }

        .tradingview-widget {
          border-radius: 8px;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .tradingview-widget-container {
            padding: 16px;
            margin: 16px 0;
          }

          .tradingview-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .tradingview-header h3 {
            font-size: 16px;
          }

          .symbol-display {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default TradingViewWidget;
