import json
import numpy as np

from flask import Flask, render_template


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simplecolormap')
def simplecolormap():
    return render_template('simple_color_map.html')

app.run(port=8080, debug=True)
