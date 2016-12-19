var path = require("path");

/**
 * If you want to use React with Babel then do :
 * npm install babel-preset-react --save=dev
 * 
 * Required packages:
 * npm install babel-loader babel-core babel-preset-es2015 --save-dev
 * npm install style-loader css-loader file-loader url-loader --save-dev
 * npm install webpack webpack-dev-server --save-dev
 */

module.exports = {
    entry: {
        scripts: "./static/scripts.js",
        routes: "./routes.js"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/dist/",
        filename: "[name].build.js"
    },
    module: {
        loaders: [
            {
            test: /\.css$/,
            loader: "style-loader!css-loader"
        }, {
            test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/,
            loader: 'url-loader'
        },
        {
            test: /\.json$/,
            loader: "json-loader"
        }
        ]
    },
    node: {
        fs: 'empty'
    }
}