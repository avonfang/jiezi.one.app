const sharp = require('sharp');
const path = require('path');

const OUT = 'C:/创业项目/4. SUMERU/images';
const BRAND_COLOR = '#5B6FE6';

const icons = ['tab-validate-sel', 'tab-history-sel', 'tab-profile-sel', 'tab-community-sel'];

Promise.all(icons.map(name =>
  sharp(path.join(OUT, name + '.png'))
    .tint(BRAND_COLOR)
    .toFile(path.join(OUT, name + '-brand.png'))
)).then(() => {
  // Replace original files
  const fs = require('fs');
  for (const name of icons) {
    const src = path.join(OUT, name + '-brand.png');
    const dst = path.join(OUT, name + '.png');
    fs.renameSync(src, dst);
  }
  console.log('Done - all icons recolored to #5B6FE6');
}).catch(e => console.error(e));
