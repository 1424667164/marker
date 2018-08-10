import cv2 as cv
import numpy as np

def bbox(train_txt):
    cv.namedWindow('show')
    images = open(train_txt,'r').read().strip().split('\n')
    for path in images[:]:
        img = cv.imread(path)
        if img is None:
            continue
        label = path.replace('/images/', '/labels/').replace('.jpg', '.txt').replace('.jpeg', '.txt').replace('.png', '.txt')
        boxs = np.loadtxt(label)
        if boxs is None:
            continue
        (h, w, _) = img.shape
        boxs = np.reshape(boxs, (boxs.size/5, 5))
        for box in boxs:
            p1 = (int(box[1]*w-box[3]*w/2), int(box[2]*h-box[4]*h/2))
            p2 = (int(box[1]*w+box[3]*w/2), int(box[2]*h+box[4]*h/2))
            img = cv.rectangle(img, p1, p2, (255,0,0), 3)
        cv.imshow('show', img)
        cv.waitKey(2000)
