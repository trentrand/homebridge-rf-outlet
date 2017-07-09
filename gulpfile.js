var gulp = require('gulp');
var clean = require('gulp-clean')
var ts = require('gulp-typescript');
var fs = require('fs');

var tsConfigPath = './tsconfig.json';

var tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
var tsProject = ts.createProject(tsConfigPath);

gulp.task('clean', function() {
  return gulp.src(['./index.js'])
    .pipe(clean({ force: true }));
});

gulp.task('compile', ['clean'], function() {
  return gulp.src('src/**/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest(tsConfig.compilerOptions.outDir));
});

gulp.task('default', ['clean', 'compile']);
