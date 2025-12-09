/**
 * Node.js簡易SSIサーバー
 * 楽天トラベルスーパーSALEキャンペーンページのプレビュー用
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = __dirname;

// MIMEタイプの定義
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

/**
 * SSIディレクティブを処理する
 * @param {string} content - HTML内容
 * @param {string} currentDir - 現在のディレクトリ
 * @param {number} depth - 再帰の深さ（無限ループ防止）
 * @returns {string} - SSI処理後の内容
 */
function processSSI(content, currentDir, depth = 0) {
  // 再帰の深さ制限（無限ループ防止）
  if (depth > 10) {
    console.warn('⚠️  SSI処理の深さが制限を超えました');
    return content;
  }

  // SSI includeディレクティブを検索
  const ssiRegex = /<!--#include\s+virtual="([^"]+)"\s*-->/g;

  return content.replace(ssiRegex, (match, includePath) => {
    // 絶対パスを処理
    let ssiFilePath;

    if (includePath.startsWith('/special/supersale/202509/')) {
      // 9SS用のパス
      ssiFilePath = path.join(BASE_DIR, '9SS', includePath.replace('/special/supersale/202509/', ''));
    } else if (includePath.startsWith('/special/supersale/202512/')) {
      // 12SS用のパス
      ssiFilePath = path.join(BASE_DIR, '12SS', includePath.replace('/special/supersale/202512/', ''));
    } else if (includePath.startsWith('/special/sales/template/html/')) {
      // テンプレート用（存在しない場合あり）
      ssiFilePath = path.join(BASE_DIR, includePath.replace('/special/sales/template/html/', ''));
    } else {
      // その他の絶対パス（共通ヘッダーなど、ローカルに存在しない可能性）
      console.log(`ℹ️  SSI not found (external): ${includePath}`);
      return `<!-- SSI not found (external resource): ${includePath} -->`;
    }

    // ファイルが存在するか確認
    if (fs.existsSync(ssiFilePath)) {
      try {
        const ssiContent = fs.readFileSync(ssiFilePath, 'utf-8');
        console.log(`✅ SSI included: ${includePath}`);

        // 再帰的にSSIを処理（入れ子のSSIに対応）
        return processSSI(ssiContent, path.dirname(ssiFilePath), depth + 1);
      } catch (error) {
        console.error(`❌ SSI読み込みエラー: ${includePath}`, error.message);
        return `<!-- SSI read error: ${includePath} -->`;
      }
    } else {
      console.log(`ℹ️  SSI not found (local): ${ssiFilePath}`);
      return `<!-- SSI not found (local file): ${includePath} -->`;
    }
  });
}

/**
 * HTTPサーバーの作成
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  console.log(`\n📥 Request: ${pathname}`);

  // ルートパスの処理
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>楽天トラベルスーパーSALE プレビューサーバー</title>
        <style>
          body { font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif; padding: 40px; background: #f5f5f5; }
          h1 { color: #bf0000; }
          .container { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          a { display: block; padding: 15px; margin: 10px 0; background: #bf0000; color: white; text-decoration: none; border-radius: 4px; text-align: center; font-weight: bold; }
          a:hover { background: #990000; }
          .info { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #0066cc; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏨 楽天トラベルスーパーSALE</h1>
          <h2>プレビューサーバー</h2>
          <div class="info">
            <strong>サーバー起動中</strong><br>
            ポート: ${PORT}<br>
            以下のリンクからプレビューを確認できます
          </div>
          <a href="/9SS/">📅 9月スーパーSALE (9SS)</a>
          <a href="/12SS/">📅 12月スーパーSALE (12SS)</a>
          <div class="info" style="background: #fff3e0; border-left-color: #ff9800;">
            <strong>⚠️ 注意事項</strong><br>
            • インターネット接続が必要です<br>
            • 一部の外部SSIファイルは表示されません<br>
            • ファイル編集後はブラウザをリロードしてください
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // 9SS/または12SS/へのアクセスをindex_sale.htmlにリダイレクト
  if (pathname === '/9SS/' || pathname === '/9SS') {
    pathname = '/9SS/index_sale.html';
  } else if (pathname === '/12SS/' || pathname === '/12SS') {
    pathname = '/12SS/index_sale_trvmkt.html';
  }

  // ファイルパスの構築
  const filePath = path.join(BASE_DIR, pathname);

  // ファイルの存在確認
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Not Found</h1><p>ファイルが見つかりません</p>');
    return;
  }

  // ディレクトリの場合
  if (fs.statSync(filePath).isDirectory()) {
    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>403 Forbidden</h1><p>ディレクトリへの直接アクセスは禁止されています</p>');
    return;
  }

  // ファイルの読み込み
  try {
    let content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // HTMLファイルの場合はSSI処理を実行
    if (ext === '.html' || ext === '.ssi') {
      console.log(`🔄 Processing SSI for: ${pathname}`);
      const htmlContent = content.toString('utf-8');
      const processedContent = processSSI(htmlContent, path.dirname(filePath));

      res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
      res.end(processedContent);
      console.log(`✅ Response sent: ${pathname}`);
    } else {
      // その他のファイル（CSS、JS、画像など）
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      console.log(`✅ Static file served: ${pathname}`);
    }
  } catch (error) {
    console.error(`❌ Error reading file: ${filePath}`, error.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>500 Internal Server Error</h1><p>ファイルの読み込みに失敗しました</p>');
  }
});

// サーバー起動
server.listen(PORT, () => {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 楽天トラベルスーパーSALE プレビューサーバー起動');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Server running at: http://localhost:${PORT}/`);
  console.log('');
  console.log('📂 利用可能なページ:');
  console.log(`   • 9月スーパーSALE:  http://localhost:${PORT}/9SS/`);
  console.log(`   • 12月スーパーSALE: http://localhost:${PORT}/12SS/`);
  console.log('');
  console.log('💡 使い方:');
  console.log('   1. 上記のURLをブラウザで開く');
  console.log('   2. ファイルを編集したらブラウザをリロード');
  console.log('   3. サーバー停止: Ctrl + C');
  console.log('');
  console.log('⚠️  注意: インターネット接続が必要です（外部リソース読み込みのため）');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');
});

// エラーハンドリング
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ エラー: ポート${PORT}は既に使用されています`);
    console.log('💡 解決方法:');
    console.log('   • 既存のサーバーを停止してください');
    console.log('   • または、server.jsの PORT を別の番号に変更してください');
  } else {
    console.error('❌ サーバーエラー:', error);
  }
  process.exit(1);
});

// Ctrl+C で終了時のメッセージ
process.on('SIGINT', () => {
  console.log('\n');
  console.log('👋 サーバーを停止します...');
  server.close(() => {
    console.log('✅ サーバーが正常に停止しました');
    process.exit(0);
  });
});
