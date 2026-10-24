---
title: "Performance improvements in NSubstitute.Analyzers 1.0.11"
published: 2019-10-21T12:57:05.000Z
categories: 
  - "nsubstitute"
tags: 
  - "nsubstitute"
  - "nsubstitute-analyzers"
  - "roslyn"
---

### 1\. Introduction

I am glad to announce that the latest release of [NSubstitute.Analyzers](https://www.nuget.org/packages/NSubstitute.Analyzers.CSharp/1.0.11) (apart from some bugfixes) brings a lot of performance and memory usage improvements for most of the analyzers. The benchmark results shown below should give you enough information about the speed and memory consumption of the newest version of the library. If you are interested in actual changes behind these results please take a look at this [pull request](https://github.com/nsubstitute/NSubstitute.Analyzers/pull/111).  

### 2\. Benchmark comparision of NSubstitute.Analyzers.CSharp

| Analyzer | Mean (us) | Error (us) | StdDev (us) | Gen 0 | Gen 1 | Allocated (KB) |
| --- | --- | --- | --- | --- | --- | --- |
| CallInfoAnalyzer | 1,897.0 | 5.646 | 5.2814 | 136.7188 | 11.7188 | 424.54 |
| ConflictingArgumentAssignmentsAnalyzer | 554.2 | 1.018 | 0.9524 | 33.2031 | 1.9531 | 103.47 |
| NonSubstitutableMemberAnalyzer | 2,466.9 | 9.317 | 8.2596 | 179.6875 | 15.6250 | 560.33 |
| NonSubstitutableMemberReceivedAnalyzer | 644.4 | 2.280 | 1.9039 | 31.2500 | 6.8359 | 96.27 |
| NonSubstitutableMemberWhenAnalyzer | 995.9 | 2.320 | 1.9370 | 37.1094 | 7.8125 | 116.74 |
| ReEntrantSetupAnalyzer | 57,979.0 | 196.824 | 174.4794 | 2333.3333 | \- | 7175.61 |
| SubstituteAnalyzer | 1,960.4 | 8.197 | 7.2666 | 89.8438 | 19.5313 | 343.67 |
| UnusedReceivedAnalyzer | 524.0 | 1.671 | 1.5630 | 29.2969 | 1.9531 | 92.45 |

| Analyzer | Mean (us) | Error (us) | StdDev (us) | Gen 0 | Gen 1 | Allocated (KB) |
| --- | --- | --- | --- | --- | --- | --- |
| CallInfoAnalyzer | 1,828.8 | 5.599 | 4.963 | 123.0469 | 11.7188 | 379.78 |
| ConflictingArgumentAssignmentsAnalyzer | 510.3 | 1.973 | 1.846 | 33.2031 | 1.9531 | 102.76 |
| NonSubstitutableMemberAnalyzer | 766.0 | 2.798 | 2.336 | 39.0625 | 8.7891 | 122.27 |
| NonSubstitutableMemberReceivedAnalyzer | 600.6 | 3.411 | 3.191 | 27.3438 | 5.8594 | 85.82 |
| NonSubstitutableMemberWhenAnalyzer | 866.0 | 3.144 | 2.941 | 34.1797 | 9.7656 | 107.87 |
| ReEntrantSetupAnalyzer | 7,442.0 | 34.067 | 31.866 | 281.2500 | 15.6250 | 870.18 |
| SubstituteAnalyzer | 1,870.2 | 29.787 | 27.863 | 87.8906 | 23.4375 | 346.09 |
| UnusedReceivedAnalyzer | 482.1 | 1.705 | 1.511 | 25.8789 | 1.9531 | 80.96 |


### 3\. Benchmark comparision of NSubstitute.Analyzers.VisualBasic

| Method | Mean (ms) | Error (ms) | StdDev (ms) | Gen 0 | Gen 1 | Allocated (KB) |
| --- | --- | --- | --- | --- | --- | --- |
| CallInfoAnalyzer | 3.459 | 0.0137 | 0.0121 | 156.2500 | 11.7188 | 484.15 |
| ConflictingArgumentAssignmentsAnalyzer | 1.279 | 0.0103 | 0.0086 | 21.4844 | 1.9531 | 69.15 |
| NonSubstitutableMemberAnalyzer | 1.975 | 0.0108 | 0.0090 | 35.1563 | 7.8125 | 108 |
| NonSubstitutableMemberReceivedAnalyzer | 1.287 | 0.0070 | 0.0065 | 13.6719 | 1.9531 | 47.46 |
| NonSubstitutableMemberWhenAnalyzer | 1.589 | 0.0103 | 0.0092 | 25.3906 | 5.8594 | 82.72 |
| ReEntrantSetupAnalyzer | 54.131 | 0.2320 | 0.1937 | 3600.0000 | \- | 11139.45 |
| SubstituteAnalyzer | 3.615 | 0.0168 | 0.0149 | 105.4688 | 23.4375 | 393.13 |
| UnusedReceivedAnalyzer | 1.306 | 0.0258 | 0.0528 | 13.6719 | 1.9531 | 43.3 |

| Analyzer | Mean (ms) | Error (ms) | StdDev (ms) | Gen 0 | Gen 1 | Allocated (KB) |
| --- | --- | --- | --- | --- | --- | --- |
| CallInfoAnalyzer | 3.737 | 0.0878 | 0.1110 | 152.3438 | 11.7188 | 471.79 |
| ConflictingArgumentAssignmentsAnalyzer | 1.402 | 0.0266 | 0.0285 | 21.4844 | 1.9531 | 68.36 |
| NonSubstitutableMemberAnalyzer | 1.543 | 0.0264 | 0.0247 | 25.3906 | 5.8594 | 81 |
| NonSubstitutableMemberReceivedAnalyzer | 1.213 | 0.0051 | 0.0048 | 13.6719 | 1.9531 | 45.43 |
| NonSubstitutableMemberWhenAnalyzer | 1.475 | 0.0055 | 0.0051 | 27.3438 | 7.8125 | 85.25 |
| ReEntrantSetupAnalyzer | 7.044 | 0.0236 | 0.0209 | 265.6250 | 7.8125 | 837.14 |
| SubstituteAnalyzer | 3.333 | 0.0912 | 0.1186 | 101.5625 | 23.4375 | 377.16 |
| UnusedReceivedAnalyzer | 1.102 | 0.0067 | 0.0062 | 11.7188 | \- | 40.24 |
