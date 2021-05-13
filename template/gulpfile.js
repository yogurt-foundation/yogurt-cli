const autoPrefixer = require('autoprefixer')
const clean = require('gulp-clean')
const concat = require('gulp-concat')
const concatCss = require('gulp-concat-css')
const gulp = require('gulp')
const gulpLoadPlugins = require('gulp-load-plugins')
const gutil = require('gulp-util')
const htmlmin = require('gulp-htmlmin')
const imagemin = require('gulp-imagemin')
const inject = gulpLoadPlugins()
const jsonmin = require('gulp-jsonmin')
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant')
const postCss = require('gulp-postcss')
const purgeCss = require('gulp-purgecss')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const sassGlob = require('gulp-sass-glob')
const serve = require('browser-sync').create()
const uglify = require('gulp-uglify-es').default
const uglifyCss = require('gulp-uglifycss')
const version = require('gulp-version-number')
const webp = require('gulp-webp')

const frameworkPath = 'framework'
const distJsPath = 'dist/assets/js'
const distProdPath = 'dist'
const distProdRecursivePath = 'dist/**/*'


// reload web browser
reload = (done) => {
  serve.reload()
  done()
}

gulp.task('serve', gulp.series(function(done) {
  serve.init({
    server: { baseDir: distProdPath },
    notify: false
  })
  done()
}))


gulp.task('build-html', () => {
  const versionConfig = {
    'value': '%MDS%', // using MDS hash
    'append': { 'key': 'v', 'to': ['css', 'js'] }
  }
  const srcHtmlPath = 'src/views/**/**/**/**/*.html'
  return gulp.src(srcHtmlPath)
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      jsmin: true, // inline js
      cssmin: true // inline css
    }))
    // inject versioning to (css,js) static assets
    .pipe(inject.versionNumber(versionConfig))
    .pipe(gulp.dest(distProdPath))
})


const srcScssPath = 'src/assets/scss/base.scss'
const distCssPath = 'dist/assets/css'
gulp.task('build-sass', () => {
  return gulp.src(srcScssPath)
    .pipe(sassGlob())
    .pipe(sass({ outputStyle: 'compressed' })
      .on('error', sass.logError))
    .pipe(postCss([autoPrefixer()]))
    .pipe(gulp.dest(distCssPath))
    .pipe(serve.reload({
      stream: true
    }))
    .pipe(gulp.dest(distCssPath))
})
gulp.task('bundle-css', () => {
  return gulp.src([
      distCssPath + '/base.css'
    ])
    .pipe(concat('style_merged.css'))
    .pipe(gulp.dest(distCssPath))
    .pipe(serve.reload({
      stream: true
    }))
})


gulp.task('build-js', () => {
  const srcAppJsPath = 'src/views'
  const srcComponentsJsPath = 'src/assets/js/components/*.js'
  return gulp.src([
      srcAppJsPath + '/app.js', // default bundle
      srcComponentsJsPath
    ])
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest(distJsPath))
    .pipe(serve.reload({
      stream: true
    }))
    .pipe(rename('scripts.pre.js'))
    .pipe(uglify())
    .pipe(gulp.dest(distJsPath))
    .pipe(serve.reload({
      stream: true
    }))
})
gulp.task('bundle-js', () => {
  return gulp.src([
      // your js files here...
      distJsPath + '/scripts.pre.js'
    ])
    .pipe(concat('app.js'))
    .pipe(gulp.dest(distJsPath))
    .pipe(serve.reload({
      stream: true
    }))
})


const srcImageRecursivePath = 'src/assets/image/**/*'
const distLqImagePath = 'dist/assets/image/low'
const distHqImagePath = 'dist/assets/image/high'
gulp.task('move-image-low', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(gulp.dest(distLqImagePath))
})
gulp.task('move-image-high', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(gulp.dest(distHqImagePath))
})

gulp.task('optimize-image-low', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(imagemin([
      pngquant({ quality: [0.5, 0.5] }), // set png quality
      mozjpeg({ quality: 50 }), // set jpg quality
    ]))
    .pipe(gulp.dest(distLqImagePath))
})
gulp.task('optimize-image-high', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(imagemin([
      pngquant({ quality: [0.8, 0.8] }), // set png quality
      mozjpeg({ quality: 80 }), // set jpg quality
    ]))
    .pipe(gulp.dest(distHqImagePath))
})
gulp.task('optimize-webp-low', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(webp({ quality: 50 })) // set webp quality
    .pipe(gulp.dest(distLqImagePath))
});
gulp.task('optimize-webp-high', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(webp({ quality: 80 })) // set webp quality
    .pipe(gulp.dest(distHqImagePath))
});


gulp.task('move-css', () => {
  return gulp.src(distCssPath + '/style_merged.css')
    .pipe(rename('style.css'))
    .pipe(gulp.dest(distCssPath))
})


gulp.task('purge-css', () => {
  return gulp.src(distCssPath + '/style_merged.css')
    .pipe(purgeCss({
      content: [
        'src/**/**/**/**/**/**/*.html',
        'src/**/**/**/**/**/**/*.js'
      ],
      // make compatible for `Yogurt CSS` framework
      defaultExtractor: content => content.match(/[\w-/:()]+(?<!:)/g) || [],
      whitelistPatterns: [/-webkit-scrollbar-thumb$/]
    }))
    .pipe(rename('style.css'))
    .pipe(gulp.dest(distCssPath))
})

gulp.task('remove-junk-js', () => {
  return gulp.src([
      distProdPath + '/assets/js/scripts.js',
      distProdPath + '/assets/js/scripts.pre.js'
    ], {
      read: false,
      allowEmpty: true
    })
    .pipe(clean())
})


gulp.task('remove-junk-css', () => {
  return gulp.src([
      distProdPath + '/assets/css/base.css',
      distProdPath + '/assets/css/style_merged.css'
    ], {
      read: false,
      allowEmpty: true
    })
    .pipe(clean())
})


gulp.task('production', gulp.series(
  'build-js',
  'bundle-js',
  'build-sass',
  'bundle-css',
  'purge-css',
  'build-html',
  'optimize-image-low',
  'optimize-image-high',
  'remove-junk-js',
  'remove-junk-css'
))


gulp.task('development', gulp.series([

  'build-js',
  'bundle-js',
  'build-sass',
  'bundle-css',
  'move-css',
  'build-html',
  'move-image-low',
  'move-image-high',
  'serve'

], () => {

  const watchSrcImagePath = 'src/assets/image/**/*'
  gulp.watch(watchSrcImagePath,
    gulp.series([
      'move-image-high',
      //'move-webp-high',
      reload
    ])
  )

  gulp.watch(watchSrcImagePath,
    gulp.series([
      'move-image-low',
      //'move-webp-low',
      reload
    ])
  )

  const watchSrcScriptsPath = 'src/assets/js/**/*.js'
  gulp.watch(watchSrcScriptsPath,
    gulp.series([
      'build-js',
      'bundle-js',
      reload
    ])
  )

  const watchSrcAppPath = 'src/views/**/*.js'
  gulp.watch(watchSrcAppPath,
    gulp.series([
      'build-js',
      'bundle-js',
      reload
    ])
  )

  const watchSrcScssPath = 'src/assets/scss/**/*.scss'
  gulp.watch(watchSrcScssPath,
    gulp.series([
      'build-sass',
      'bundle-css',
      'move-css',
      reload
    ])
  )

  const watchSrcHtmlPath = 'src/views/**/*.html'
  gulp.watch(watchSrcHtmlPath,
    gulp.series([
      'build-html',
      'move-css',
      reload
    ])
  )

}))

