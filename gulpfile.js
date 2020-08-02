var gulp = require('gulp');
var typescript = require('gulp-tsc');
var sass = require('gulp-sass');
var cleanCss = require('gulp-clean-css');

var sourcePath = './projects/x-widgets/src/*.tsx';
var targetPath = './demo/src/assets/x-widgets/src/';
var tsconfigPath = './projects/x-widgets/tsconfig.json';
var scssPath = './projects/x-arcgis/src/lib/themes/**/*.scss';
var scssTargetPath = './demo/src/assets/themes/';

function copy() {
  return gulp.src(sourcePath).pipe(gulp.dest(targetPath));
}

gulp.task('copy', function () {
  return copy();
});

function compile() {
  return gulp
    .src([sourcePath])
    .pipe(typescript({ project: tsconfigPath }))
    .pipe(gulp.dest(targetPath));
}

gulp.task('compile', function () {
  return compile();
});

gulp.task('sass', function () {
  return compileCss();
});

function compileCss() {
  return gulp
    .src([scssPath])
    .pipe(sass())
    .pipe(cleanCss({ compatibility: 'ie8' }))
    .pipe(gulp.dest(scssTargetPath));
}

exports.default = function () {
  return gulp.watch(sourcePath, gulp.parallel(copy, compile));
};

exports.scss = function () {
  return gulp.watch(scssPath, gulp.parallel(compileCss));
};
