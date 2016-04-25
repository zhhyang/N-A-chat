/**
 * Created by Freeman on 2016/4/25.
 */
var gulp = require('gulp'),
    gulpCleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean');

gulp.task('default',['clean'],function () {

    gulp.start('minifycss','minifyjs');
});

gulp.task('minifycss', function() {
    return gulp.src('public/stylesheets/*.css')      //压缩的文件
        .pipe(gulp.dest('public/build/css'))   //输出文件夹
        .pipe(gulpCleanCSS());   //执行压缩
});

gulp.task('minifyjs',function () {

    return gulp.src('public/javascripts/**/*.js')
        .pipe(concat('main.js'))
        .pipe(gulp.dest('public/build/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('public/build/js'));
});

gulp.task('clean', function() {
    return gulp.src(['public/build'], {read: false})
        .pipe(clean());
});