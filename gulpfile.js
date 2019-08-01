var browserSync  = require('browser-sync').create(),
	autoprefixer = require('gulp-autoprefixer'),
	gulp         = require('gulp'),
	sass         = require('gulp-sass');

function initBrowserSyncServer() {
	browserSync.init({
		server: {
			baseDir: 'app'
		}
	});
	gulp.watch('app/sass/**/*.+(scss|sass)').on('change', compileSass);
	gulp.watch(['app/js/**/*.js','app/**/*.html','app/**/*.php']).on('change', browserSync.reload);
};

function initBrowserSyncProxy() {
	browserSync.init({
		proxy: "questionnaire"
	});
	gulp.watch('app/sass/**/*.+(scss|sass)').on('change', compileSass);
	gulp.watch(['app/js/**/*.js','app/**/*.html','app/**/*.php']).on('change', browserSync.reload);
}

function compileSass() {
	return gulp.src('app/sass/**/*.scss')
	.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
	.pipe(autoprefixer())
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.stream());
};

exports.watch = gulp.series(compileSass, initBrowserSyncServer);
exports.proxy = gulp.series(compileSass, initBrowserSyncProxy);
exports.default = gulp.series(compileSass, initBrowserSyncServer);