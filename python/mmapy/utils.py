def d2r(d):
    # convert degree to radians
    return(d/180.*np.pi)

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
