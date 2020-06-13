var gulp = require('gulp');
var typescript = require('gulp-tsc');

var sourcePath = './projects/x-widgets/src/*.tsx';
var targetPath = './demo/src/assets/x-widgets/src/';
var tsconfigPath = './projects/x-widgets/tsconfig.json';

function copy() {
  return gulp.src(sourcePath).pipe(gulp.dest(targetPath));
}

gulp.task('copy', function () {
  return gulp.src(sourcePath).pipe(gulp.dest(targetPath));
});

function compile() {
  return gulp
    .src([sourcePath])
    .pipe(typescript({ project: tsconfigPath }))
    .pipe(gulp.dest(targetPath));
}

gulp.task('compile', function () {
  return gulp
    .src([sourcePath])
    .pipe(typescript({project: tsconfigPath}))
    .pipe(gulp.dest(targetPath));
});

exports.default = function () {
  return gulp.watch(sourcePath, gulp.parallel(copy, compile));
};
