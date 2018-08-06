import os
import numpy as np
import cv2

listFile = []

def listDir(path):
    global listFile
    listDir_ = os.listdir(path)
    for pth in listDir_:
        pth = os.path.join(path, pth)
        print pth
        if os.path.isdir(pth):
            listDir(pth)
        elif os.path.isfile(pth) and os.path.splitext(pth)[1] == ".jpg":
            img = cv2.imread(pth)
            if img is None:
                continue
            h, w, _ = img.shape
            listFile += ["0 " + pth + ' %d %d'%(w, h)]

listDir("/Users/mjl/Documents/Programming/python/")
np.savetxt("./config.txt", np.array(listFile, dtype=str), fmt="%s")
