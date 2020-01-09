"use strict";

// Load plugins
const browsersync = require("browser-sync").create();
const cssnano = require("gulp-cssnano");
const del = require("del");
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const rename = require("gulp-rename");
const uglify = require('gulp-uglify');
const tailwindcss = require('tailwindcss');
const purgecss = require('gulp-purgecss');

// Define paths
var paths = {
    base: {
        base: './',
        node: 'node_modules'
    },
    src: {
        base: './src',
        html: 'src/*.html',
        css: 'src/css/**/*.css',
        js: 'src/js/**/*.js',
        cssdir: 'src/css',
    },
    dist: {
        base: './dist',
        css: 'dist/css',
        js: 'dist/js',
    }
};

class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:\/]+/g);
  }
}

// Clean dist files
function clean() {
    return del([paths.dist.base]);
}

// Copy HTML files to output directory
function copyHtml() {
  return gulp
    .src(paths.src.html)
    .pipe(gulp.dest(paths.dist.base));
}

// CSS task
function css() {
    return gulp
        .src('src/css/**/*.css')
        .pipe(postcss([tailwindcss('./tailwind.config.js'), require('autoprefixer'), ]))
        .pipe(gulp.dest(paths.src.cssdir))
        .pipe(browsersync.stream());
}

// Minify CSS
function minifyCss() {
    return gulp
        .src(paths.src.css)
        .pipe(cssnano())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest(paths.dist.css));
}

function purgeCSS() {
  return gulp
    .src(paths.src.css)
    .pipe(
        purgecss({
          content: [paths.src.base + "*.html"],
          extractors: [
            {
              extractor: TailwindExtractor,
              extensions: ["html", "js"]
            }
          ]
      })
    )
    .pipe(gulp.dest(paths.dist.css));
}

// Minify JS
function minifyJs() {
    return gulp
        .src(paths.src.js)
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.dist.js));
}

// BrowserSync
function browserSync(done) {
    browsersync.init({
        open: false,
        server: {
            baseDir: paths.dist.base
        },
    });
    done();
}

// BrowserSync Reload
function browserSyncReload(done) {
    browsersync.reload();
    done();
}

// Watch files
function watchFiles() {
    gulp.watch(paths.src.html, gulp.series(copyHtml, browserSyncReload));
    gulp.watch("./tailwind.config.js", css);
    gulp.watch(paths.src.js, gulp.series(minifyJs, browserSyncReload));
}

// Complex tasks
const build = gulp.series(clean, css, minifyCss, minifyJs, purgeCSS);
const watch = gulp.parallel(watchFiles, browserSync,);

exports.build = build;
exports.default = watch;
