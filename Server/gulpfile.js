const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const watch = require('gulp-watch');

const tsProject = ts.createProject('tsconfig.json');

function web() {
    return gulp.src(['src/**/*.html', 'src/**/*.css'])
        .pipe(gulp.dest('dist'));
};

function script() {
    return gulp.src('src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
};

function watchSource() {
    return gulp.watch(['src/**/*.html', 'src/**/*.css', 'src/**/*.ts'], gulp.series(web, script));
}

exports.default = gulp.series(web, script);
exports.watch = watchSource;
