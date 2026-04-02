import fs from 'fs';

const html1 = fs.readFileSync('posts_prontos.html', 'utf8');
const html2 = fs.readFileSync('story_seguranca.html', 'utf8');

function embedImages(htmlStr) {
  return htmlStr.replace(/url\(\'([^\']+)\'\)/g, (match, url) => {
    try {
      // Remove o file:/// do Windows
      let filePath = url.replace('file:///', '');
      const base64 = fs.readFileSync(filePath, 'base64');
      return `url('data:image/png;base64,${base64}')`;
    } catch(e) {
      console.error(e);
      return match;
    }
  });
}

const finalHtml1 = embedImages(html1);
const finalHtml2 = embedImages(html2);

fs.writeFileSync('posts_prontos.html', finalHtml1);
fs.writeFileSync('story_seguranca.html', finalHtml2);

console.log("Os arquivos HTML foram re-escritos com as imagens embarcadas e visíveis!");
