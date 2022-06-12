import numpy as np
import string

d2r=np.deg2rad

def lonlat2vec(loc):
    """
    Convert lon,lat to unit vector
    Input: [list] 2-element list containing [longitude,latitude] (in degrees)
    Output: [lest] unit vector
    """
    vec=np.array([np.cos(d2r(loc[0]))*np.cos(d2r(loc[1])),
        np.sin(d2r(loc[0]))*np.cos(d2r(loc[1])),
        np.sin(d2r(loc[1]))])
    return vec

def rotate(lon,lat,ang):
    # create rotation matrix from (1,0,0) to lon,lat,ang)
    # NOT USED
    angrot=np.array([[1,0,0],[0,np.cos(d2r(ang)),-np.sin(d2r(ang))],[0,np.sin(d2r(ang)),np.cos(d2r(ang))]])
    lonrot=np.array([[np.cos(d2r(lon)),-np.sin(d2r(lon)),0],[np.sin(d2r(lon)),np.cos(d2r(lon)),0],[0,0,1]])
    latrot=np.array([[np.cos(d2r(-lat)),0,np.sin(d2r(-lat))],[0,1,0],[-np.sin(d2r(-lat)),0,np.cos(d2r(-lat))]])
    matrot=np.matmul(np.matmul(lonrot,latrot),angrot)
    return matrot

def truncate(x,dp=3):
    return float('{0:.{1}f}'.format(x, dp))

class Location(object):
    def __init__(self,loc):
        """
        Set location of event, centred on 15deg grid squares
        Inputs [float,float]: [longitude, latitude] (degrees)
        Attributes added: [[float,float],[int,int],string]: [[snaplon,snaplat],[cell x, cell y],cellname]
            * loc [float,float]: array of [lon,lat] (degrees)
            * grid [float]: grid size (degrees)
            * cellloc [float,float]: [lat,lon] of cell centre (degrees)
            * cellxy [float,float]: [x,y] coordinates of cell
            * cellname: name of cell
        Outputs: None
        """
        assert len(loc)==2, 'ERROR: non-valid location: {}'.format(loc)
        assert (loc[1]<=90 and loc[1]>=-90),'ERROR: latitude not in range [-90,90]: {}'.format(loc[1])
        assert (loc[0]<=360 and loc[0]>=-0),'ERROR: longitude not in range [0,360]: {}'.format(loc[0])
        self.loc=loc
        self.grid=15.
        gridlon=np.floor(self.loc[0]/self.grid)*self.grid + self.grid/2
        gridlat=np.floor(self.loc[1]/self.grid)*self.grid + self.grid/2
        self.cellloc=[gridlon,gridlat]
        self.cellxy=[int(self.cellloc[0]/15),int((90-self.cellloc[1])/15)]

        # get cell names
        raStr=string.ascii_uppercase[:24]
        decStr=[str(x) for x in np.arange(12) + 1]
        decStr.reverse()
        self.cellname=raStr[int(self.cellloc[0]/15)]+decStr[int((90-self.cellloc[1])/15)]
        return
