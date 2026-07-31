const fs = require('fs');
const content = fs.readFileSync('lovable_styles.css', 'utf8');

const classes = ['.container-x', '.btn-primary', '.btn-outline', '.section-pad'];
for (const cls of classes) {
  // Find index of the class selector in CSS
  const index = content.indexOf(cls);
  if (index !== -1) {
    // Print the selector and surrounding rules
    console.log(`STYLING FOR ${cls}:`);
    console.log(content.substring(index, index + 300));
    console.log("------------------------");
  } else {
    console.log(`Class ${cls} not found.`);
  }
}
