all: js/bundle.js

js/bundle.js: js/plot_simplecolormap.js
	browserify js/plot_simplecolormap.js --ignore-missing -d -o js/bundle.js -v
