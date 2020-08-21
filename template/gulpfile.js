const autoPrefixer = require('autoprefixer')
const clean = require('gulp-clean')
const concatCss = require('gulp-concat-css')
const concat = require('gulp-concat')
const gulp = require('gulp')
const gutil = require('gulp-util')
const htmlmin = require('gulp-htmlmin')
const imagemin = require('gulp-imagemin')
const jsonmin = require('gulp-jsonmin')
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant')
const postCss = require('gulp-postcss')
const purgeCss = require('gulp-purgecss')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const sassGlob = require('gulp-sass-glob')
const serve = require('browser-sync').create()
const uglifyCss = require('gulp-uglifycss')
const uglify = require('gulp-uglify-es').default
const webp = require('gulp-webp')
const version = require('gulp-version-number')
const gulpLoadPlugins = require('gulp-load-plugins')
const inject = gulpLoadPlugins()

const frameworkPath = 'framework'
const distJsPath = 'dist/assets/js'
const distProdPath = 'dist'
const distProdRecursivePath = 'dist/**/*'


// reload web browser
reload = (done) => {
  serve.reload()
  done()
}


// ...serve http
gulp.task('serve', gulp.series(function(done) {
  serve.init({
    server: {
      baseDir: distProdPath
    },
    notify: false
  })
  done()
}))


// ...minify html
const versionConfig = {
  'value': '%MDS%', // using MDS hash
  'append': { 'key': 'v', 'to': ['css', 'js'] }
}
const srcHtmlPath = 'src/views/**/**/**/**/*.html'
gulp.task('html', () => {
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


// ...minify/preprocess scss
const srcScssPath = 'src/assets/scss/base.scss'
const distCssPath = 'dist/assets/css'
gulp.task('sass', () => {
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
// ...bundle with Yogurt
gulp.task('css', () => {
  return gulp.src([
      distCssPath + '/base.css'
    ])
    .pipe(concat('style_merged.css'))
    .pipe(gulp.dest(distCssPath))
    .pipe(serve.reload({
      stream: true
    }))
})


// ...bundle your custom js
const srcAppJsPath = 'src/views'
const srcComponentsJsPath = 'src/assets/js/**/**/**/**/*.js'
gulp.task('pre-scripts', () => {
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
// ...bundle js files
gulp.task('scripts', () => {
  return gulp.src([
      distJsPath + '/scripts.pre.js'
    ])
    .pipe(concat('app.js'))
    .pipe(gulp.dest(distJsPath))
    .pipe(serve.reload({
      stream: true
    }))
})


const srcImageRecursivePath = 'src/assets/image/**/*'
const distImagePath = 'dist/assets/image'
gulp.task('image', () => {
  return gulp.src(srcImageRecursivePath)
    .pipe(imagemin([
      pngquant({ quality: [1, 1] }), // set png quality
      mozjpeg({ quality: 100 }), // set jpg quality
    ]))
    .pipe(gulp.dest(distImagePath))
})


// ...purge unused css
gulp.task('purge-css', () => {
  return gulp.src(distCssPath + '/style_merged.css')
    .pipe(purgeCss({
        content: [
          'src/views/**/**/**/**/**/**/*.html'
        ],
        // make compatible for `Yogurt CSS` framework
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        whitelistPatterns: [/-webkit-scrollbar-thumb$/],
        keyframes: true
    }))
    .pipe(rename('style.css'))
    .pipe(gulp.dest(distCssPath))
})


// ...remove artifact files
gulp.task('remove-js', () => {
  return gulp.src([
  distProdPath + '/assets/js/scripts.js',
  distProdPath + '/assets/js/scripts.pre.js'
  ], {
    read: false,
    allowEmpty: true
  })
  .pipe(clean())
})
gulp.task('remove-css', () => {
  return gulp.src([
  distProdPath + '/assets/css/base.css',
  distProdPath + '/assets/css/style_merged.css'
  ], {
    read: false,
    allowEmpty: true
  })
  .pipe(clean())
})


// ...watch
const watchSrcAppPath = 'src/views/**/*.js'
const watchSrcHtmlPath = 'src/views/**/*.html'
const watchSrcScssPath = 'src/assets/scss/**/*.scss'
const watchSrcScriptsPath = 'src/assets/js/**/*.js'
const watchSrcImagePath = 'src/assets/image/**/*'
gulp.task('watch', gulp.series([

    'pre-scripts',
    'scripts',
    'sass',
    'css',
    'purge-css',
    'html',
    'serve'

  ], () => {

    gulp.watch(watchSrcImagePath,
      gulp.series([
        'image',
        reload
      ])
    )

    gulp.watch(watchSrcScriptsPath,
      gulp.series([
        'pre-scripts',
        'scripts',
        reload
        ])
      )

    gulp.watch(watchSrcAppPath,
      gulp.series([
        'pre-scripts',
        'scripts',
        reload
      ])
    )

    gulp.watch(watchSrcScssPath,
      gulp.series([
        'sass',
        'css',
        'purge-css',
        reload
      ])
    )

    gulp.watch(watchSrcHtmlPath,
      gulp.series([
        'html',
        'purge-css',
        reload
      ])
    )

  })
)
