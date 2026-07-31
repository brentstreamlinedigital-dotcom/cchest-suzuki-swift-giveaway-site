const fs = require('fs');
const content = fs.readFileSync('lovable_routes.js', 'utf8');

// Find function Ye
const match = content.match(/function Ye\([\s\S]*?\}\}(?=\s*function|\s*export|\Z)/);
if (match) {
  console.log("MATCH FOUND:");
  console.log(match[0].substring(0, 1000));
  console.log("...");
  console.log(match[0].substring(match[0].length - 1000));
} else {
  // Let's do a broader regex
  const match2 = content.match(/function Ye[\s\S]*?\{[\s\S]*?\}/);
  if (match2) {
    console.log("BROADER MATCH FOUND:");
    console.log(match2[0]);
  } else {
    console.log("NOT FOUND");
  }
}
