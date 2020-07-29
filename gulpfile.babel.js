/*
    The following Gulp files follows the setup outlined in the 
    following two articles:

    https://css-tricks.com/gulp-for-wordpress-initial-setup/
    https://css-tricks.com/gulp-for-wordpress-creating-the-tasks/

    The gulpfile.js is configured to be placed in the root of your theme.
    This file may need some configuration changes based on your sites setup.
*/


// IMPORT GULP PLUGINS:

import { src, dest, watch, series, parallel } from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import browserSync from 'browser-sync';


/* -------------------------------- */
/* -------------------------------- */


// CREATE VARIABLES

const PRODUCTION = yargs.argv.prod;
const server = browserSync.create();


/* -------------------------------- */
/* -------------------------------- */


// REFRESH THE BROWSER

export const serve = done => {
    server.init({
        proxy: 'http://simalam-coding-practicum:8888/' // put your local website link here
    });
    done();
};

export const reload = done => {
    server.reload();
    done();
};

/*
    In order to control the browser using Browsersync, we have to initialize a Browsersync server. 
    This is different from a local server where WordPresss would typically live. 
    
    The first task is serve, which starts the Browsersync server, and is pointed to our local 
    WordPress server using the proxy option. 
    
    The second task will simply reload the browser.

    Now we need to run this server when we are developing our theme. 
    We add the serve task to the dev series of tasks below:

    Run 'npm start' and the browser should open up a new URL that’s different from the original one. 
    This URL is the one that Browsersync will refresh. 
*/


/* -------------------------------- */
/* -------------------------------- */


// CLEAN FOLDERS

export const clean = () => del(['dist']);

/*
    Clean the dist folder every time to start developing or building a theme.
*/


/* -------------------------------- */
/* -------------------------------- */


// CONVERT SASS TO CSS

export const styles = () => {
    return src('src/scss/main.scss')
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(PRODUCTION, postcss([ autoprefixer ])))
        .pipe(gulpif(PRODUCTION, cleanCss({compatibility:'ie8'})))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(dest('dist/css'))
        .pipe(server.stream());
}

/*
    Sourcemaps plugin:

    1. Initialize the plugin using 'sourcemaps.init()'.
    2. Pipe all the plugins that you would like to map.
    3. Create the source map file by calling 'sourcemaps.write()' just before writing the bundle 
       to the destination.

    Style Reload without Refresh:

    If you have Browsersync installed that allows us to inject CSS directly to the page without 
    even having to reload the browser. 
    
    This can be done by adding '.pipe(server.stream())' at the very end of the styles task.
*/


/* -------------------------------- */
/* -------------------------------- */


// COMPRESS IMAGES

export const images = () => {
    return src('src/images/**/*.{jpg,jpeg,png,svg,gif}')
        .pipe(gulpif(PRODUCTION, imagemin()))
        .pipe(dest('dist/images'));
}

/*
    - Give the 'src()' function a glob that matches all .jpg, .jpeg, .png, .svg and .gif images 
      in the 'src/images' directory. 
    - Run the imagemin plugin, but only for production. 
    - Compressing images can take some time and isn’t necessary during development, so we can 
      leave it out of the development flow. 
    - Put the compressed versions of images in 'dist/images'.

    Any images we drop into 'src/images' will be copied when we run 'gulp images'. 
    
    Running 'gulp images --prod', will both compress and copy the image over.
*/


/* -------------------------------- */
/* -------------------------------- */


// COPY ANY FILES AND FOLDERS IN THE SRC FOLDER EXCEPT THOSE SPECIFIED

export const copy = () => {
    return src(['src/**/*','!src/{images,js,scss},','!src/{images,js,scss}/**/*'])
        .pipe(dest('dist'));
}

/*
    Deleting the added file in the 'src' folder won't update the content in the 'dist' folder 
    as the above task only handles copying. 
    
    This problem could also happen for our /images, /js and /scss, folders. 
    
    If you have old images or JavaScript and CSS bundles that were removed from the src folder, 
    then they won’t get removed from the dist folder. 
    
    Use the 'clean' task above on the dist folder every time you start developing 
    or building a theme.
*/


/* -------------------------------- */
/* -------------------------------- */


// SCRIPTS

/* Run either 'gulp scripts' or 'gulp scripts --prod' */

export const scripts = () => {
    return src('src/js/bundle.js')
        .pipe(webpack({
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: []
                            }
                        }
                    }
                ]
            },
            mode: PRODUCTION ? 'production' : 'development',
            devtool: !PRODUCTION ? 'inline-source-map' : false,
            output: {
                filename: 'bundle.js'
            },
        }))
        .pipe(dest('dist/js'));
}

/*
    - First specify bundle.js as our entry point in the 'src()' function.
    - Then, we pipe the webpack plugin and specify some options for it.
    - The rules field in the module option lets webpack know what loaders to use in order to 
      transform files. 
    - In this case we need to transform JavaScript files using the babel-loader.
    - The mode option is either production or development. 
    - For development, webpack will not minify the output JavaScript bundle, but it will for 
      production. 
    - We don’t need a separate Gulp plugin to minify JavaScript because webpack can do that 
      depending on our PRODUCTION constant.
    - The devtool option will add source maps, but not in production. 
    - In development, however, we will use inline-source-maps. 
      (This kind of source maps is the most accurate though it can be a bit slow to create. 
      If you find it too slow, check the other options at:
      https://webpack.js.org/configuration/devtool/ 
      They won’t be as accurate as inline-source-maps but they can be pretty fast.)
    - The output option can specify some information about the output file. 
    - Here we only need to change the filename. 
    - If we don’t specify the filename, webpack will generate a bundle with a hash as the filename.
*/


/* -------------------------------- */
/* -------------------------------- */


// WATCH FOR CHANGES

export const watchForChanges = () => {
    watch('src/scss/**/*.scss', styles);
    watch('src/images/**/*.{jpg,jpeg,png,svg,gif}', series (images, reload));
    watch(['src/**/*','!src/{images,js,scss','!src/{images,js,scss}/**/*'], series(copy, reload));
    watch('src/js/**/*.js', series(scripts, reload));
    watch('**/*.php', reload);
}

/*
    Run 'gulp watchForChanges' and the command line will be on a constant, ongoing watch for changes 
    in any specified directories. When changes happen, the task will run with no further action on our part.
*/


/* -------------------------------- */
/* -------------------------------- */


// COMPOSE SERIES OF TASKS

export const dev = series(clean, parallel(styles, images, copy, scripts), serve, watchForChanges)
export const build = series(clean, parallel(styles, images, copy, scripts))
export default dev;

/*
    Note, both tasks will do the exact same thing: clean the dist folder, 
    then styles, images and copy will run in parallel once the cleaning is complete. 
    We will start watching for changes as well for the dev task, after these parallel tasks. 
    Additionally, we are also exporting dev as the default task.

    When we run the build task, we want our files to be minified, images to be compressed, and so on. 
    So, when we run this command, we will have to add the --prod flag. 
    Since this can easily be forgotten when running the build task, use npm scripts to create aliases 
    for the dev and build commands. 
   
    Go to package.json, and in the scripts field there should something like:

    "scripts": {
        "test": "echo "Error: no test specified" && exit 1"
    },

    Change it to:
   
    "scripts": {
        "start": "gulp",
        "build": "gulp build --prod"
    },

    This will allow us to run 'npm run start' in the command line, which will go to the scripts field 
    and find what command corresponds to start. In this case, start will run 'gulp' and gulp will run 
    the default gulp task, which is dev. 
    
    Similarly, 'npm run build' will run 'gulp build --prod'. This way, we can forget about the --prod flag 
    and also forget about running the Gulp tasks using the gulp command. 

*/