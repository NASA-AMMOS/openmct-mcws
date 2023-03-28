# Lines of code

Per release, we report on total lines of code, plus the different in lines of 
code since the latest release.  The `cloc` tool is used for this.  On a mac, the 
easiest way to install this tool is via homebrew.

## Release Summary

Inside the vista directory, run the following command.  Replace the version 
specifier with the tag for the new VISTA version.

```
cloc `git rev-list -n 1 v4.0.0-rc4` \
    --not-match-f='(Spec.js|\.(html|png|scss|svg|css|xml|json|md|rb))$' \
    --match-d='src' 
```

The results should look like:

```
› cloc `git rev-list -n 1 v4.0.0-rc4` \
    --not-match-f='(Spec.js|\.(html|png|scss|svg|css|xml|json|md|rb))$' \
    --match-d='src'

     140 text files.
     140 unique files.                                          
       2 files ignored.

github.com/AlDanial/cloc v 1.76  T=1.74 s (80.0 files/s, 7167.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     139           1301           2334           8811
-------------------------------------------------------------------------------
SUM:                           139           1301           2334           8811
-------------------------------------------------------------------------------

```


## Difference since last re;ease

Update tags to point to versions you'd like to compare.

```
cloc --diff \
    `git rev-list -n 1 v3.6.0` \
    `git rev-list -n 1 v4.0.0-rc4` \
    --not-match-f='(Spec.js|\.(html|png|scss|svg|css|xml|json|md|rb))$' \
    --match-d='src' 
```

The results should look like:

```
› cloc --diff \
    `git rev-list -n 1 v3.6.0` \
    `git rev-list -n 1 v4.0.0-rc4` \
    --not-match-f='(Spec.js|\.(html|png|scss|svg|css|xml|json|md|rb))$' \
    --match-d='src'
      10 text files.
      18 text files.
       0 files ignored.                             

github.com/AlDanial/cloc v 1.76  T=1.34 s (0.7 files/s, 0.7 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript
 same                            0              0            116            771
 modified                        9              0              0             33
 added                           9             86             47            594
 removed                         1             20             31            161
-------------------------------------------------------------------------------
SUM:
 same                            0              0            116            771
 modified                        9              0              0             33
 added                           9             86             47            594
 removed                         1             20             31            161
-------------------------------------------------------------------------------
```

